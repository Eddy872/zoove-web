"use client"

import {
  useEffect
} from "react"

import {
  getMessaging,
  isSupported,
  onMessage
} from "firebase/messaging"

import {
  firebaseApp
} from "@/services/firebase"

export default function FirebaseNotificationListener() {
  useEffect(() => {
    let unsubscribe:
      (() => void) | undefined

    async function startListener() {
      try {
        const supported =
          await isSupported()

        if (!supported) {
          return
        }

        const messaging =
          getMessaging(firebaseApp)

        unsubscribe =
          onMessage(
            messaging,
            (payload) => {
              console.log(
                "Notification reçue au premier plan :",
                payload
              )

              const title =
                payload.notification?.title ||
                "Zoove"

              const body =
                payload.notification?.body ||
                ""

              /*
               * Pour commencer, tu peux utiliser
               * une alerte. Ensuite, on pourra
               * la remplacer par un toast.
               */
              window.alert(
                `${title}\n${body}`
              )
            }
          )
      } catch (error) {
        console.error(
          "Erreur écoute notifications :",
          error
        )
      }
    }

    startListener()

    return () => {
      unsubscribe?.()
    }
  }, [])

  return null
}
