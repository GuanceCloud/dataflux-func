package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/md5"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

var COLOR_MAP = map[string]string{
	"grey":    "\033[0;30m",
	"red":     "\033[0;31m",
	"green":   "\033[0;32m",
	"yellow":  "\033[0;33m",
	"blue":    "\033[0;34m",
	"magenta": "\033[0;35m",
	"cyan":    "\033[0;36m",
}

func CreateRandomString() string {
	rand.Seed(time.Now().UnixNano())
	randInt := rand.Int63()
	randStr := strconv.FormatInt(randInt, 36)

	return randStr
}

func colored(s, color string) string {
	if color == "" {
		color = "yellow"
	}

	color = COLOR_MAP[color]

	return color + s + "\033[0m"
}

type WATClient struct {
	AKID          string
	AKSecret      string
	Host          string
	Port          int
	Timeout       int
	UseHTTPS      bool
	AKSignVersion string
	Debug         bool
}

func NewWATClient(akId, akSecret, host string, port int, timeout int, useHTTPS bool, akSignVersion string) *WATClient {
	c := &WATClient{
		AKID:          akId,
		AKSecret:      akSecret,
		Host:          host,
		Port:          port,
		Timeout:       timeout,
		UseHTTPS:      useHTTPS,
		AKSignVersion: akSignVersion,
		Debug:         false,
	}

	return c
}

func (c *WATClient) GetBodyMD5(bodyBytes []byte) string {
	h := md5.New()
	h.Write(bodyBytes)
	return hex.EncodeToString(h.Sum(nil))
}

func (c *WATClient) GetSign(method, path, timestamp, nonce string, bodyBytes []byte) string {
	if timestamp == "" {
		timestamp = fmt.Sprint(time.Now().Unix())
	}

	if nonce == "" {
		nonce = CreateRandomString()
	}

	stringToSign := ""
	if c.AKSignVersion == "v2" {
		stringToSign = strings.Join([]string{c.AKSignVersion, timestamp, nonce, strings.ToUpper(method), path, c.GetBodyMD5(bodyBytes)}, "&")
	} else {
		stringToSign = strings.Join([]string{timestamp, nonce, strings.ToUpper(method), path}, "&")
	}

	hmacSha1 := hmac.New(sha1.New, []byte(c.AKSecret))
	hmacSha1.Write([]byte(stringToSign))
	sign := hex.EncodeToString(hmacSha1.Sum(nil))

	if c.Debug {
		fmt.Println(colored("[String to Sign]", "yellow"), colored(c.AKSignVersion, "cyan"), stringToSign)
	}

	return sign
}

func (c *WATClient) VerifySign(sign, method, path, timestamp, nonce string, bodyBytes []byte) bool {
	expectedSign := c.GetSign(method, path, timestamp, nonce, bodyBytes)

	return (sign == expectedSign)
}

func (c *WATClient) GetAuthHeader(method, path string, bodyBytes []byte) map[string]string {
	timestamp := fmt.Sprint(time.Now().Unix())
	nonce := CreateRandomString()

	sign := c.GetSign(method, path, timestamp, nonce, bodyBytes)

	authHeader := map[string]string{
		"X-Wat-Ak-Sign-Version": c.AKSignVersion,
		"X-Wat-Ak-Id":           c.AKID,
		"X-Wat-Ak-Timestamp":    timestamp,
		"X-Wat-Ak-Nonce":        nonce,
		"X-Wat-Ak-Sign":         sign,
	}
	return authHeader
}

func (c *WATClient) VerifyAuthHeader(headers map[string]string, method, path string, bodyBytes []byte) bool {
	timestamp, ok := headers["X-Wat-Ak-Timestamp"]
	if !ok {
		timestamp = ""
	}

	nonce, ok := headers["X-Wat-Ak-Nonce"]
	if !ok {
		nonce = ""
	}

	sign, ok := headers["X-Wat-Ak-Sign"]
	if !ok {
		sign = ""
	}

	return c.VerifySign(sign, method, path, timestamp, nonce, bodyBytes)
}

func (c *WATClient) Run(method, path, query, body string, headers map[string]string, traceId string) (int, string) {
	// Prepare method/query/body
	method = strings.ToUpper(method)

	if len(query) > 0 {
		if query[0] == '?' {
			path = path + query
		} else {
			path = path + "?" + query
		}
	}

	// Body is already a string

	if c.Debug {
		fmt.Println(strings.Repeat("=", 50))
		fmt.Println(colored("[Request]", "yellow"), colored(method, "cyan"), colored(path, "cyan"))
		if body != "" {
			fmt.Println(colored("[Payload]", "yellow"), body)
		}
	}

	// Prepare headers with auth info
	if headers == nil {
		headers = map[string]string{}
	}
	headers["Content-Type"] = "application/json"
	if len(traceId) > 0 {
		headers["X-Trace-Id"] = traceId
	}

	authHeaders := c.GetAuthHeader(method, path, []byte(body))
	for k, v := range authHeaders {
		headers[k] = v
	}

	// Do HTTP/HTTPS
	httpClient := &http.Client{}

	protocol := "http://"
	if c.UseHTTPS {
		protocol = "https://"
	}

	req, err := http.NewRequest(method, protocol+c.Host+path, strings.NewReader(body))
	if err != nil {
		panic(err)
	}

	if headers != nil {
		for k, v := range headers {
			req.Header.Set(k, v)
		}
	}

	resp, err := httpClient.Do(req)
	defer resp.Body.Close()

	// Get response
	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}

	respStatusCode := resp.StatusCode
	respData := string(respBody)

	if c.Debug {
		_color := "green"
		if respStatusCode >= 400 {
			_color = "red"
		}

		fmt.Println(colored("[Response]", _color), colored(strconv.Itoa(respStatusCode), _color))
		fmt.Println(colored("[Payload]", _color), colored(respData, _color))
	}

	return respStatusCode, respData
}

func (c *WATClient) Upload(path string, fileBytes []byte, filename, query string, fields, headers map[string]string, traceId string) (int, string) {
	// Prepare method/query/fields/file
	method := "POST"

	if filename == "" {
		filename = "uploadfile"
	}

	filename = url.QueryEscape(filename)

	if len(query) > 0 {
		if query[0] == '?' {
			path = path + query
		} else {
			path = path + "?" + query
		}
	}

	// Body is already a string

	// FormData
	formDataBuffer := new(bytes.Buffer)
	formData := multipart.NewWriter(formDataBuffer)

	if fields != nil {
		for k, v := range fields {
			formData.WriteField(k, v)
		}
	}

	fomrDataFile, _ := formData.CreateFormFile("files", filename)
	fomrDataFile.Write(fileBytes)

	formData.Close()

	if c.Debug {
		fmt.Println(strings.Repeat("=", 50))
		fmt.Println(colored("[Request]", "yellow"), colored(method, "cyan"), colored(path, "cyan"))
		if fields != nil {
			fmt.Println(colored("[Fields]", "yellow"), fields)
		}
		if fileBytes != nil {
			fmt.Println(colored("[File]", "yellow"), filename)
		}
	}

	// Prepare headers with auth info
	if headers == nil {
		headers = map[string]string{}
	}
	headers["Content-Type"] = "application/json"
	if len(traceId) > 0 {
		headers["X-Trace-Id"] = traceId
	}

	authHeaders := c.GetAuthHeader(method, path, formDataBuffer.Bytes())
	for k, v := range authHeaders {
		headers[k] = v
	}

	headers["Content-Type"] = formData.FormDataContentType()

	// Do HTTP/HTTPS
	httpClient := &http.Client{}

	protocol := "http://"
	if c.UseHTTPS {
		protocol = "https://"
	}

	req, err := http.NewRequest(method, protocol+c.Host+path, formDataBuffer)
	if err != nil {
		panic(err)
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := httpClient.Do(req)
	defer resp.Body.Close()

	// Get response
	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}

	respStatusCode := resp.StatusCode
	respData := string(respBody)

	if c.Debug {
		_color := "green"
		if respStatusCode >= 400 {
			_color = "red"
		}

		fmt.Println(colored("[Response]", _color), colored(strconv.Itoa(respStatusCode), _color))
		fmt.Println(colored("[Payload]", _color), colored(respData, _color))
	}

	return respStatusCode, respData
}

func (c *WATClient) Get(path, query string, headers map[string]string, traceId string) (int, string) {
	return c.Run("GET", path, query, "", headers, traceId)
}

func (c *WATClient) Post(path, query, body string, headers map[string]string, traceId string) (int, string) {
	return c.Run("POST", path, query, body, headers, traceId)
}

func (c *WATClient) Put(path, query, body string, headers map[string]string, traceId string) (int, string) {
	return c.Run("Put", path, query, body, headers, traceId)
}

func (c *WATClient) Delete(path, query string, headers map[string]string, traceId string) (int, string) {
	return c.Run("DELETE", path, query, "", headers, traceId)
}

func main() {
	testSuit := func(akSignVersion string) {
		c := NewWATClient("ak-7Qf3KXH8QZOrW8Tf", "WaYGi4cBsievlfZsNhE3fY40ZB9dI9L3", "ubuntu16-dev-big.vm", 80, 3, false, akSignVersion)
		c.Debug = true

		// 1. GET Request Test
		c.Get("/api/v1/do/ping", "", nil, "TEST-GO-001-" + akSignVersion)

		// 2. POST Request Test
		body := `{"echo":{"int":1,"str":"Hello World","unicode":"你好，世界！","none":null,"boolean":true}}`
		c.Post("/api/v1/do/echo", "", body, nil, "TEST-GO-002-" + akSignVersion)

		// 3. UPLOAD Request Test
		fields := map[string]string {
			"note" : "This is a Chinese README. 这是一份中文使用说明。",
		}
		fileBytes, _ := ioutil.ReadFile("使用说明_SDK.md")
		c.Upload("/api/v1/files/do/upload", fileBytes, "使用说明_SDK.md", "", fields, nil, "TEST-GO-003-" + akSignVersion)
	}

	testSuit("v2")
	testSuit("v2")
	testSuit("")
}
