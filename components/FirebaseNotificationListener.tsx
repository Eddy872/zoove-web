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

        if (
          typeof window === "undefined"
        ) {
          return
        }


        const supported =
          await isSupported()


        if (!supported) {
          console.log(
            "FCM non supporté sur ce navigateur"
          )

          return
        }


        if (
          Notification.permission !==
          "granted"
        ) {

          console.log(
            "Notifications Web non autorisées"
          )

          return
        }


        const messaging =
          getMessaging(firebaseApp)


        unsubscribe =
          onMessage(
            messaging,
            (payload) => {

              console.log(
                "🔔 Notification FCM reçue au premier plan :",
                payload
              )


              const title =
                payload.notification?.title ||
                "Zoove"


              const body =
                payload.notification?.body ||
                ""


              console.log(
                "Titre :",
                title
              )

              console.log(
                "Message :",
                body
              )

              console.log(
                "Data :",
                payload.data
              )


              window.alert(
                `${title}\n${body}`
              )
            }
          )


        console.log(
          "✅ Listener Firebase actif"
        )

      } catch (error) {

        console.error(
          "❌ Erreur écoute notifications :",
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
