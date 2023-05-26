package main

import (
    "os"
    "bytes"
    "fmt"
    "io"
    "mime/multipart"

    // DataFlux Func SDK
    "./dataflux_func_sdk"
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

func main() {
    host := "localhost:8088"
    if len(os.Args) >= 2 {
        host = os.Args[1]
    }

    // Create DataFlux Func Client
    dff := dataflux_func_sdk.NewDataFluxFunc("ak-xxxxx", "xxxxxxxxxx", host, 30, false)

    // Debug ON
    dff.Debug = true

    // Send GET Request
    _, _, err := dff.Get("/api/v1/do/ping", nil, nil, "")
    if err != nil {
        panic(err)
    }

    // Send POST Request
    body := map[string]interface{}{
        "echo": map[string]interface{}{
            "int"    : 1,
            "str"    : "Hello World",
            "unicode": "你好，世界！",
            "none"   : nil,
            "boolean": true,
        },
    }
    _, _, err = dff.Post("/api/v1/do/echo", body, nil, nil, "")
    if err != nil {
        panic(err)
    }

    // Send UPLOAD Request
    filename := "dataflux_func_sdk_demo.go"
    file, _ := os.Open(filename)
    fileContents, _ := io.ReadAll(file)

    uploadBody := &bytes.Buffer{}
    writer := multipart.NewWriter(uploadBody)

    part, _ := writer.CreateFormFile("files", filename)
    part.Write(fileContents)

    fields := map[string]string{
        "folder": "test",
    }
    for key, value := range fields {
        writer.WriteField(key, fmt.Sprintf("%v", value))
    }

    writer.Close()
    contentType := writer.FormDataContentType()

    _, _, err = dff.Upload("/api/v1/resources/do/upload", filename, "", fields, nil, nil, uploadBody, contentType)
    if err != nil {
        panic(err)
    }
}
