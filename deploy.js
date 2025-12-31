import { publish } from 'gh-pages'

const DIST_FOLDER = 'dist'

console.log(`---> deploying from folder: ${DIST_FOLDER}`)

publish(DIST_FOLDER, (err) => {
  if (err) {
    console.log(`---> error: ${err}`)
    process.exit(1)
  } else {
    console.log(`---> all done.`)
  }
})
