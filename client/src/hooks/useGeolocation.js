import { useState, useEffect, useCallback } from 'react'

export const useGeolocation = (options = {}) => {
  const [loading, setLoading] = useState(false)
  const [coordinates, setCoordinates] = useState(null)
  const [error, setError] = useState(null)
  const [permissionState, setPermissionState] = useState('prompt') // 'prompt', 'granted', 'denied', 'unsupported'

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported')
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        setCoordinates(coords)
        setPermissionState('granted')
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        console.warn('Geolocation error:', err)
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionState('denied')
            setError('Location access was denied. Please select your location manually.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Location information is currently unavailable.')
            break
          case err.TIMEOUT:
            setError('Request to get user location timed out. Please try again.')
            break
          default:
            setError('An unknown geolocation error occurred.')
            break
        }
      },
      defaultOptions
    )
  }, [options])

  // Check initial permission status if the Permissions API is supported
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermissionState(status.state)
        
        // Listen for changes to permission state
        status.onchange = () => {
          setPermissionState(status.state)
          if (status.state === 'granted') {
            getPosition()
          } else if (status.state === 'denied') {
            setCoordinates(null)
          }
        }
      })
    }
  }, [getPosition])

  return {
    coordinates,
    loading,
    error,
    permissionState,
    getLocation: getPosition
  }
}
