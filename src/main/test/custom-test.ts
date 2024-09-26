import { expect, test, vi } from 'vitest'
import fs from 'node:fs/promises'

const trackData = [
  {
    uri: 'spotify:track:1337',
    name: '1337 Track',
    album: {
      uri: 'spotify:album:1337',
      name: '1337 Album',
      images: [
        {
          width: 64,
          height: 64,
          url: 'https://1337-64-test-image.png'
        },
        {
          width: 300,
          height: 300,
          url: 'https://1337-300-test-image.png'
        },
        {
          width: 640,
          height: 640,
          url: 'https://1337-640-test-image.png'
        }
      ]
    },
    artists: [
      {
        name: '1337 Artist',
        uri: 'spotify:artist:1337'
      }
    ]
  },
  {
    uri: 'spotify:track:888',
    name: '888 Track',
    album: {
      uri: 'spotify:album:888',
      name: '888 Album',
      images: [
        {
          width: 32,
          height: 32,
          url: 'https://1337-32-test-image.png'
        },
        {
          width: 150,
          height: 150,
          url: 'https://1337-150-test-image.png'
        },
        {
          width: 320,
          height: 320,
          url: 'https://1337-320-test-image.png'
        }
      ]
    },
    artists: [
      {
        name: '888 Artist',
        uri: 'spotify:artist:888'
      }
    ],
    linked_from: {
      uri: 'spotify:track:1234'
    }
  }
]

const state1337TrackPaused = {
  timestamp: '1719432114603',
  is_paused: true,
  position_as_of_timestamp: '1337',
  duration: '2000',
  track: {
    uri: 'spotify:track:1337'
  }
} as const

const state1337TrackPlaying = {
  timestamp: '1719432114603',
  is_paused: false,
  position_as_of_timestamp: 1337,
  duration: 2000,
  track: {
    uri: 'spotify:track:1337'
  }
} as const

const expectBlankTextFilesWrites = async () => {
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Artist.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Track.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Album.txt', '')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_URI.txt', '')
}

const expected1337TrackFileWrites = async () => {
  expect(fs.writeFile).toBeCalledWith(
    '\\mocked-output\\dir\\Spotilocal.txt',
    '1337 Track - 1337 Artist'
  )
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Artist.txt', '1337 Artist')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Track.txt', '1337 Track')
  expect(fs.writeFile).toBeCalledWith('\\mocked-output\\dir\\Spotilocal_Album.txt', '1337 Album')
  expect(fs.writeFile).toBeCalledWith(
    '\\mocked-output\\dir\\Spotilocal_URI.txt',
    'spotify:track:1337'
  )
}

vi.mock('../env', () => ({
  outputDirectory: '/mocked-output/dir/'
}))

vi.mock('../index', () => ({
  fetchImageFromRenderer: (url: string) =>
    new Promise((resolve) => resolve('mock-fetched-image-' + url))
}))

vi.mock('../disk-storage', () => ({
  settingsDiskStore: {
    store: {}
  }
}))

vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
    unlink: vi.fn().mockImplementation(async () => {})
  }
}))

export const spotiTest = test.extend({
  expected1337TrackFileWrites: (async ({}, use) =>
    use(expected1337TrackFileWrites)) as typeof expected1337TrackFileWrites,
  expectBlankTextFilesWrites: (async ({}, use) =>
    use(expectBlankTextFilesWrites)) as typeof expectBlankTextFilesWrites,
  trackData,
  state1337TrackPaused,
  state1337TrackPlaying
})
