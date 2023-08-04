const requestFairplayLicense = async (
  emeOptions,
  _assetId, // already included in spc, no need to add to body again
  keyMessage,
  callback
) => {
  const base64Payload = encodeURIComponent(
    btoa(String.fromCharCode(...new Uint8Array(keyMessage)))
  )
  console.debug('Fairplay license request', {keyMessage, base64Payload, assetIdInSpc: _assetId})
  const rawResponse = await fetch(
    emeOptions.keySystems['com.apple.fps.1_0'].licenseUri,
    {
      method: 'POST',
      headers: {
        ...emeOptions.emeHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `spc=${base64Payload}`,
    }
  ).then(response => response.arrayBuffer())
  const responseMessage = new TextDecoder('utf-8').decode(rawResponse).trim()
  const unwrapped =
    responseMessage.slice(0, 5) === '<ckc>' &&
    responseMessage.slice(-6) === '</ckc>'
      ? Uint8Array.from(atob(responseMessage.slice(5, -6)), c => c.charCodeAt(0))
      : responseMessage
  console.debug('Fairplay license response', {rawResponse, responseMessage, unwrapped})
  callback(null, new Uint8Array(unwrapped))
}

const getFairplayAssetId = (_, initData) => 
  new TextDecoder('utf-16').decode(initData).trim().slice(8) // trim skd:// prefix

export {requestFairplayLicense, getFairplayAssetId}
