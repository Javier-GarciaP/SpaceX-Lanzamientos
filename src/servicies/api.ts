import { type Doc,  type APISpaceX } from '../types/spacex'

export const getLaunchBy = async ({id}: { id: string }) => {
  const res = await fetch(`https://api.spacexdata.com/v5/launches/${id}`)

  const launche = await res.json() as Doc
  return launche
}

export const getLatestLaunches = async () => {
  const res = await fetch('https://api.spacexdata.com/v5/launches/query', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {},
      options: {
        sort: {
          date_unix: "asc"
        },
        limit: 10,
      }
    })
  })
  const { docs: launches } = await res.json() as APISpaceX
  return launches
}
