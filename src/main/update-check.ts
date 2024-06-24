import { gt } from 'semver'

export const isUpdateAvailable = async () => {
  const response = await fetch('https://api.github.com/repos/jmswrnr/spotilocal/releases/latest')
  const json = await response.json()
  const latestVersion = json.tag_name.replace('v', '')
  return gt(latestVersion, __VERSION__)
}
