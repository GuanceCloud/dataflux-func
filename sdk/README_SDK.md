# README (Web App Template SDK)

## Access via `Access Key`

The 3rd part system can access this Web App by `Access Key ID` and `Access Secret` (`AK`).

### 1. Generating a `AK` pair

The `AK` pair can be generated on the [Access Key management page](/access-keys).

### 2. Sign your request

To sign your request, you need following fields:

|      Fields     |                    Description                    |              Example               |
|-----------------|---------------------------------------------------|------------------------------------|
| AK Timestamp    | Current UNIX timestamp (in second).               | `1527532323`                       |
| AK Nonce        | A random string.                                  | `0.15029408624960117`              |
| HTTP Method     | Upper cased HTTP method                           | `POST`                             |
| FULL URL        | Request URL (include query string)                | `/api/v1/path?a=1&b=2`             |
| AK Sign Version | New in `v2`. No need in `v1`                      | `v2`                               |
| Body MD5        | New in `v2`. Use `''` to compute MD5 when no body | `d41d8cd98f00b204e9800998ecf8427e` |

There is `v1` and `v2` signature versions:

1. The signature of `v1` is:

`Hmac-SHA1("<AK Timestamp>&<AK Nonce>&<METHOD>&<FULL URL>", <AK Secret>)`

2. The signature of `v2` is:

`Hmac-SHA1("<AK Sign Version>&<AK Timestamp>&<AK Nonce>&<METHOD>&<FULL URL>&<Body MD5>", <AK Secret>)`

### 3. Add Signature information into request header

|          Header         |                  Description                  |                  Example                   |
|-------------------------|-----------------------------------------------|--------------------------------------------|
| `X-Wat-Ak-Id`           | Access Key ID                                 | `ak-abcde12345`                            |
| `X-Wat-Ak-Timestamp`    | UNIX timestamp used in sign                   | `1527532323`                               |
| `X-Wat-Ak-Nonce`        | A random string used in sign                  | `0.15029408624960117`                      |
| `X-Wat-Ak-Sign`         | Signature result                              | `431f70c44d5f7c97dcc87c20060e2480acdf3a04` |
| `X-Wat-Ak-Sign-Version` | AK Sign Version. New in `v2`. No need in `v1` | `v2`                                       |

#### Custom HTTP headers for signature

Signature information can be put in different headers by setting `Header Fields` option:

- Python:
```python
header_fields = {
    'akSignVersion': 'X-Custom-Header-For-Ak-Sign-Version',
    'akId'         : 'X-Custom-Header-For-Ak-Id',
    'akTimestamp'  : 'X-Custom-Header-For-Ak-Timestamp',
    'akNonce'      : 'X-Custom-Header-For-Ak-Nonce',
    'akSign'       : 'X-Custom-Header-For-Ak-Sign',
}
client = WATClient(host=host, ak_id=ak_id, ak_secret=ak_secret, header_fields=header_fields)
```

- Javascript:
```javascript
var watClient = new WATClient({
  akId         : akId,
  akSecret     : akSecret,
  akSignVersion: akSignVersion,
  headerFields: {
    akSignVersion: 'X-Custom-Header-For-Ak-Sign-Version',
    akId         : 'X-Custom-Header-For-Ak-Id',
    akTimestamp  : 'X-Custom-Header-For-Ak-Timestamp',
    akNonce      : 'X-Custom-Header-For-Ak-Nonce',
    akSign       : 'X-Custom-Header-For-Ak-Sign',
  }
});
```

### 4. Send your request

Now, just send your request.

## Avaliable resources

We already implemented HTTP Client for some programming language:

| Language |    File Path     |                                                   Description                                                    |
|----------|------------------|------------------------------------------------------------------------------------------------------------------|
| Python   | `sdk/wat_sdk.py` | No dependency for common operations. Compatible with Python 2.6 ~ 3.7. Require `requests` for upload supporting. |
| Node.js  | `sdk/wat_sdk.js` | No dependency. No need to compile. Require `form-data` for upload supporting.                                    |
