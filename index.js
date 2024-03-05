import tsWhammy from 'https://cdn.jsdelivr.net/npm/ts-whammy-melleb@1.1.2/+esm'
// import {
//   default as tsWhammy
// } from 'https://cdn.jsdelivr.net/npm/ts-whammy-melleb@1.1.2/+esm'

const createVideo = (src) => {
  const video = document.createElement('video')

  video.src = src
  video.autoplay = false
  video.volume = 0.2

  return video
}

const log = R.curry((tag, input) => {
  console.log(tag, input);
  return input
})

const fromImageArrayWithOptions = R.curry((options, list) => tsWhammy.default.fromImageArrayWithOptions(list, options))
const fromImageArray = R.curry((fps, list) => tsWhammy.default.fromImageArray(list, fps))

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

const toDataURL = url => fetch(url)
  .then(response => response.blob())
  .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  }))

const createObjectURL = (obj) => URL.createObjectURL(obj)

const createVideoFromImage = R.pipe(
  // toDataURL,
  createImg,
  getImageDataURL,
  R.andThen(R.pipe(
    // R.of(Array),
    // log('arr'),
    R.repeat(R.__, 181),
    // fromImageArray(60),
    fromImageArrayWithOptions({
      // fps: 60,
      duration: 3,
    }),
    createObjectURL,
    createVideo,
  ))
)

const main = async () => {
  const video = await createVideoFromImage('https://miro.medium.com/v2/resize:fit:1024/1*OK8xc3Ic6EGYg2k6BeGabg.jpeg')
  const video2 = createVideo("http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4")
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

  // video.addEventListener('ended', () => {
  //   video.cancelVideoFrameCallback();
  // })
}

main()