import {useEffect, useRef} from 'react'
import Head from 'next/head'
import videojs from 'video.js'
import 'videojs-contrib-eme'
import 'video.js/dist/video-js.css'
import styles from '@/styles/Home.module.css'
import getStreamInfo from '@/src/getStreamInfo'
import {getFairplayAssetId, requestFairplayLicense} from '@/src/fairplay'

const options = {
  autoplay: true,
  controls: true,
}

const bvOptions = {
  apiHost: '',
  orgId: '',
  apiKey: 'eyJh...',
  resourceType: 'RESOURCE_TYPE_VOD',
  resourceId: 'xxxxxxxx-xxxx-xxx-xxx-xxxxxxxxxxxx',
}

const getVjsDrmOptions = streamInfo => {
  if (!streamInfo.licenseUrl) {
    return {}
  }
  const drmLicenseUrl = `${streamInfo.licenseUrl}/api/v3/drm/license`

  return {
    emeHeaders: streamInfo.playbackToken && {
      'X-Custom-Data': `token_type=upfront&token_value=${streamInfo.playbackToken}`,
    },
    keySystems: {
      'com.widevine.alpha': drmLicenseUrl,
      'com.microsoft.playready': drmLicenseUrl,
      'com.apple.fps.1_0': {
        certificateUri: `${drmLicenseUrl}/fairplay_cert`,
        licenseUri: drmLicenseUrl,
        getContentId: getFairplayAssetId,
        getLicense: requestFairplayLicense,
      },
    },
  }
}

const SampleVideo = () => {
  const videoRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js')
      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready')
      }))
      playerRef.current = player
      player.eme()

      getStreamInfo(bvOptions)
        .then(streamInfo => {
          // check for Safari-only prefixed EME, pick HLS if available
          const src = streamInfo[window.WebKitMediaKeys ? 'hls' : 'dash']
          console.debug({streamInfo, src})
          return player.src({src, ...getVjsDrmOptions(streamInfo)})
        })
        .catch(e => console.debug(e))
    }
  }, [])

  useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  )
}

const Home = () => (
  <>
    <Head>
      <title>video.js + BV One DRM, React sample</title>
      <meta name="description" content="Generated by create next app" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <main className={`${styles.main}`}>
      <SampleVideo />
    </main>
  </>
)

export default Home
