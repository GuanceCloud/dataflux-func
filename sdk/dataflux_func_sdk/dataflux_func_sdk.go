package dataflux_func_sdk

import (
	"bytes"
	"crypto/hmac"
	"crypto/md5"
	"crypto/rand"
	"crypto/sha1"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

var (
	colorMap = map[interface{}]string{
		"grey":    "\033[0;30m",
		"red":     "\033[0;31m",
		"green":   "\033[0;32m",
		"yellow":  "\033[0;33m",
		"blue":    "\033[0;34m",
		"magenta": "\033[0;35m",
		"cyan":    "\033[0;36m",
	}
)

// colored The terminal prints debug data
func colored(s string, color interface{}) string {
	if color == nil {
		color = "yellow"
	}
	colorValue := colorMap[color]

	return strings.Join([]string{colorValue, s, "\033[0m"}, "")
}

// CreateRandomUuid Randomly generate Uuid
func CreateRandomUuid() string {
	uuid := make([]byte, 16)
	n, err := rand.Read(uuid)
	if err != nil {
		panic(err)
	}
	if n != len(uuid) {
		panic("failed to read random bytes")
	}
	// Set version (4) and variant (2) bits
	uuid[6] = (uuid[6] & 0x0f) | 0x40
	uuid[8] = (uuid[8] & 0xbf) | 0x80

	return hex.EncodeToString(uuid)
}

// CompactJsonMarshal appends to dst the JSON-encoded src with
// insignificant space characters elided.
func CompactJsonMarshal(data interface{}, enum int64) (string, bytes.Buffer) {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		panic(err)
	}
	var compactJsonBytes bytes.Buffer
	err = json.Compact(&compactJsonBytes, jsonBytes)
	if err != nil {
		panic(err)
	}
	if enum == 0 {
		return compactJsonBytes.String(), bytes.Buffer{}
	} else {
		return "", compactJsonBytes
	}
}

// DataFluxFunc DataFluxFunc struct
type DataFluxFunc struct {
	AkId     string
	AkSecret string
	Host     string
	Timeout  int
	UseHttps bool
	Debug    bool
}

func NewDataFluxFunc(akId, akSecret, host string, timeout int, useHttps bool) *DataFluxFunc {
	return &DataFluxFunc{
		AkId:     akId,
		AkSecret: akSecret,
		Host:     host,
		Timeout:  timeout,
		UseHttps: useHttps,
		Debug:    false,
	}
}

// getBodyMd5 Encrypt the data inside the body using md5
func (dff *DataFluxFunc) getBodyMd5(body interface{}) (string, error) {
	if body == nil {
		body = make(map[string]interface{})
	}
	bodyStr, _ := CompactJsonMarshal(body, 0)
	if dff.Debug {
		fmt.Printf("%s %s\n", colored("[Body to MD5]", nil), bodyStr)
	}
	h := md5.New()
	h.Write([]byte(bodyStr))
	return hex.EncodeToString(h.Sum(nil)), nil
}

// getSign Signature Generation
func (dff *DataFluxFunc) getSign(method, path, timestamp, nonce string, body interface{}) (string, error) {
	method = strings.ToUpper(method)

	if timestamp == "" {
		timestamp = strconv.FormatInt(time.Now().Unix(), 10)
	}
	if nonce == "" {
		nonce = CreateRandomUuid()
	}

	bodyMd5, err := dff.getBodyMd5(body)
	if err != nil {
		return "", err
	}

	argsSlice := []string{method, path, timestamp, nonce, bodyMd5}
	stringSign := strings.Join(argsSlice, "&")

	if dff.Debug {
		fmt.Printf("%s %s\n", colored("[String to Sign]", nil), stringSign)
	}

	h := hmac.New(sha1.New, []byte(dff.AkSecret))
	h.Write([]byte(stringSign))
	sign := hex.EncodeToString(h.Sum(nil))

	if dff.Debug {
		fmt.Printf("%s %v\n", colored("[Signature]", nil), sign)
	}
	return sign, nil
}

// verifySign SignatureValidation
func (dff *DataFluxFunc) verifySign(sign, method, path, timestamp, nonce string, body interface{}) (bool, error) {
	_sign, err := dff.getSign(method, path, timestamp, nonce, body)
	if err != nil {
		return false, err
	}
	if _sign == sign {
		return true, nil
	}
	return false, nil
}

// getAuthHeader Assemble the request header for authentication
func (dff *DataFluxFunc) getAuthHeader(method, path string, body interface{}) (http.Header, error) {
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)

	nonce := CreateRandomUuid()

	sign, err := dff.getSign(method, path, timestamp, nonce, body)
	if err != nil {
		return nil, err
	}

	authHeaders := make(http.Header)
	authHeaders.Set("X-Dff-Ak-Id", dff.AkId)
	authHeaders.Set("X-Dff-Ak-Timestamp", timestamp)
	authHeaders.Set("X-Dff-Ak-Nonce", nonce)
	authHeaders.Set("X-Dff-Ak-Sign", sign)

	return authHeaders, nil
}

// verifyAuthHeader Verify the assembled authentication request header
func (dff *DataFluxFunc) verifyAuthHeader(headers http.Header, method, path string, body interface{}) (bool, error) {
	_headers := make(map[string]string)
	for k := range headers {
		_headers[strings.ToLower(k)] = headers.Get(k)
	}

	sign := _headers["x-dff-ak-sign"]
	if sign == "" {
		sign = ""
	}

	timestamp := _headers["x-dff-ak-timestamp"]
	if timestamp == "" {
		timestamp = ""
	}

	nonce := _headers["x-dff-ak-nonce"]
	if nonce == "" {
		nonce = ""
	}

	flag, err := dff.verifySign(sign, method, path, timestamp, nonce, body)
	if err != nil {
		return false, err
	}
	return flag, nil
}

func (dff *DataFluxFunc) run(method, path string, query url.Values, body interface{}, header http.Header, traceID string) (int, interface{}, error) {
	method = strings.ToUpper(method)
	if query != nil {
		path = path + "?" + query.Encode()
	}
	_, dumpedBody := CompactJsonMarshal(body, 1)
	if dff.Debug {
		fmt.Println(strings.Repeat("=", 50))
		fmt.Printf("%s %s %s\n", colored("[Request]", nil), colored(method, "cyan"), colored(path, "cyan"))
	}
	if header == nil {
		header = make(http.Header)
	}
	header.Set("Content-Type", "application/json")
	if traceID != "" {
		header.Set("X-Trace-Id", traceID)
	}

	if dff.AkId != "" && dff.AkSecret != "" {
		authHeaders, err := dff.getAuthHeader(method, path, body)
		if err != nil {
			return 0, nil, err
		}

		for k, v := range authHeaders {
			header.Set(k, v[0])
		}
	}
	// Do HTTP / HTTPS
	var transport http.RoundTripper
	var reqUrl string
	if dff.UseHttps {
		transport = &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
		reqUrl = "https://" + dff.Host + path
	} else {
		transport = http.DefaultTransport
		reqUrl = "http://" + dff.Host + path
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   time.Second * 30,
	}

	var req *http.Request
	var err error
	if body != nil {
		req, err = http.NewRequest(method, reqUrl, &dumpedBody)
		if err != nil {
			return 0, nil, err
		}
	} else {
		req, err = http.NewRequest(method, reqUrl, nil)
		if err != nil {
			return 0, nil, err
		}
	}

	req.Header = header

	resp, err := client.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()

	respStatusCode := resp.StatusCode
	respRawData, _ := io.ReadAll(resp.Body)

	respContentType := resp.Header.Get("Content-Type")
	if respContentType != "" {
		respContentType = strings.Split(respContentType, ";")[0]
	}

	var respData interface{}
	if respContentType == "application/json" {
		err = json.Unmarshal(respRawData, &respData)
		if err != nil {
			return 0, nil, err
		}
	} else {
		respData = respRawData
	}
	if dff.Debug {
		var color string
		if respStatusCode >= 400 {
			color = "red"
		} else {
			color = "green"
		}
		fmt.Printf("%s %d\n", colored("[Response]", color), respStatusCode)
		fmt.Printf("%s %s\n", colored("[Body]", color), string(respRawData))
	}
	return respStatusCode, respData, nil
}

// Send file
func (dff *DataFluxFunc) Upload(path, fileName, traceID string, fields interface{}, headers http.Header, query url.Values, fileBuffer *bytes.Buffer, contentType string) (int, interface{}, error) {
	method := "POST"

	if fileName == "" {
		fileName = "uploadfile"
	}
	fileName = url.QueryEscape(fileName)
	if query != nil {
		path = path + "?" + query.Encode()
	}

	if fields != nil {
		_, ok := fields.(map[string]string)
		if !ok {
			return 0, nil, errors.New("`fields` should be a plain JSON")
		}
	}
	dumpedFields, _ := CompactJsonMarshal(fields, 0)

	if headers == nil {
		headers = make(http.Header)
	}

	if dff.Debug {
		fmt.Println(strings.Repeat("=", 50))
		fmt.Printf("%s %s %s\n", colored("[Request]", nil), colored(method, "cyan"), colored(path, "cyan"))
		if fields != nil {
			fmt.Printf("%s %s\n", colored("[Fields]", nil), dumpedFields)
		}
	}
	// Do HTTP / HTTPS
	var transport http.RoundTripper
	var reqUrl string
	if dff.UseHttps {
		transport = &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
		reqUrl = "https://" + dff.Host + path
	} else {
		transport = http.DefaultTransport
		reqUrl = "http://" + dff.Host + path
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   time.Second * 30,
	}

	req, err := http.NewRequest(method, reqUrl, fileBuffer)
	if err != nil {
		return 0, nil, err
	}
	req.URL.RawQuery = query.Encode()

	if fields != nil {
		headers.Set("Content-Type", contentType)
	}

	if traceID != "" {
		headers.Set("X-Trace-Id", traceID)
	}
	if dff.AkId != "" && dff.AkSecret != "" {
		_, ok := fields.(map[string]string)
		if ok {
			authHeaders, err := dff.getAuthHeader(method, path, fields)
			if err != nil {
				return 0, nil, err
			}
			for k, _ := range authHeaders {
				headers.Set(k, authHeaders.Get(k))
			}
		}
	}
	req.Header = headers

	// Do Request
	resp, err := client.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()

	respStatusCode := resp.StatusCode
	respRawData, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, err
	}
	respContentType := resp.Header.Get("Content-Type")
	if respContentType == "" {
		respContentType = ""
	}

	var respData interface{}
	if respContentType == "application/json" {
		err := json.Unmarshal(respRawData, &respData)
		if err != nil {
			return 0, nil, err
		}
	} else {
		respData = string(respRawData)
	}

	if dff.Debug {
		_color := "green"
		if respStatusCode >= 400 {
			_color = "red"
		}
		fmt.Printf("%s %d\n", colored("[Response]", _color), respStatusCode)
		fmt.Printf("%s %s\n", colored("[Body]", _color), respRawData)
	}
	return respStatusCode, respData, nil
}

// Get request
func (dff *DataFluxFunc) Get(path string, query url.Values, headers http.Header, traceID string) (int, interface{}, error) {
	return dff.run("GET", path, query, nil, headers, traceID)
}

// Post request
func (dff *DataFluxFunc) Post(path string, body interface{}, query url.Values, headers http.Header, traceID string) (int, interface{}, error) {
	return dff.run("POST", path, query, body, headers, traceID)
}

// Put request
func (dff *DataFluxFunc) Put(path string, body interface{}, query url.Values, headers http.Header, traceID string) (int, interface{}, error) {
	return dff.run("PUT", path, query, body, headers, traceID)
}

// Delete request
func (dff *DataFluxFunc) Delete(path string, query url.Values, headers http.Header, traceID string) (int, interface{}, error) {
	return dff.run("DELETE", path, query, nil, headers, traceID)
}
