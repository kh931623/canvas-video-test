import tsWhammy from 'https://cdn.jsdelivr.net/npm/ts-whammy-melleb@1.1.2/+esm'

const data = [
  {
    index: 0,
    sentence: "This is a simple Javascript test",
    media: "https://miro.medium.com/max/1024/1*OK8xc3Ic6EGYg2k6BeGabg.jpeg",
    duration: 3
  },
  {
    index: 1,
    sentence: "Here comes the video!",
    media: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    duration: 5
  }
]

const createVideo = (src) => {
  const video = document.createElement('video')

  video.src = src
  video.autoplay = false
  video.volume = 0.2

  if (R.startsWith('blob', src)) {
    video.addEventListener('load', () => {
      URL.revokeObjectURL(src)
    })
  }

  return video
}

const log = R.curry((tag, input) => {
  console.log(tag, input);
  return input
})

const fromImageArrayWithOptions = R.curry((options, list) => tsWhammy.default.fromImageArrayWithOptions(list, options))

const createImg = (src) => {
  const img = document.createElement('img')

  img.src = src
  img.crossOrigin = 'Anonymous'

  return img
}

const getImageDataURL = (img) => new Promise((resolve) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  img.addEventListener('load', () => {
    canvas.height = img.naturalHeight
    canvas.width = img.naturalWidth
    ctx.drawImage(img, 0, 0)

    resolve(canvas.toDataURL('image/webp'))
  })
})

const createObjectURL = (obj) => URL.createObjectURL(obj)

const createVideoFromImage = (src, duration) => {
  return R.pipe(
    createImg,
    getImageDataURL,
    R.andThen(R.pipe(
      // generate enough frames for presenting video with 60 fps
      R.repeat(R.__, duration * 60 + 1),
      fromImageArrayWithOptions({
        duration,
      }),
      createObjectURL,
      createVideo,
    ))
  )(src)
}

const main = async () => {
  const video = await createVideoFromImage(data[0].media, data[0].duration)
  const video2 = createVideo(data[1].media)
  let callbackId = null

  const canvas = document.getElementById('c1')

  canvas.addEventListener('click', () => {
    if (video.ended) {
      if (video2.paused) video2.play()
      else video2.pause()
    } else {
      if (video.paused) video.play()
      else video.pause()
    }
  })

  const updateCanvas = (canvas, video) => () => {
    const ctx = canvas.getContext('2d')

    ctx.drawImage(video, -1, 0, canvas.width, canvas.height)
    callbackId = video.requestVideoFrameCallback(updateCanvas(canvas, video))
  }

  const playVideo = (canvas, video) => () => {
    console.log('played');
    callbackId = video.requestVideoFrameCallback(updateCanvas(canvas, video))
  }

  const clearVideo = (canvas, video) => () => {
    console.log('ended');
    const ctx = canvas.getContext('2d')

    video.cancelVideoFrameCallback(callbackId)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const playVideo2 = () => {
    video2.currentTime = 5
    video2.play()
  }

  const resetVideo = (video) => () => video.currentTime = 0

  const onVideoEnded = R.pipe(
    clearVideo(canvas, video),
    playVideo2,
  )

  const onBothVideoEnded = R.pipe(
    clearVideo(canvas, video2),
    resetVideo(video),
    resetVideo(video2),
  )

  video.addEventListener('play', playVideo(canvas, video))
  video.addEventListener('ended', onVideoEnded)

  video2.addEventListener('play', playVideo(canvas, video2))
  video2.addEventListener('ended', onBothVideoEnded)
}

main()