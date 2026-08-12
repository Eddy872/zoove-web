import {
  getMessaging,
  getToken,
  isSupported
} from "firebase/messaging"

import {
  firebaseApp
} from "./firebase"

export async function getWebNotificationToken():
Promise<string> {
  try {
    console.log("Étape 1 : début")

    if (
      typeof window === "undefined"
    ) {
      console.error(
        "Erreur étape 1 : window absent"
      )

      return ""
    }

    if (
      !("Notification" in window)
    ) {
      console.error(
        "Erreur étape 2 : Notification non supportée"
      )

      return ""
    }

    if (
      !("serviceWorker" in navigator)
    ) {
      console.error(
        "Erreur étape 3 : Service Worker non supporté"
      )

      return ""
    }

    console.log(
      "Étape 2 : navigateur compatible"
    )

    const supported =
      await isSupported()

    console.log(
      "Étape 3 : Firebase supporté =",
      supported
    )

    if (!supported) {
      return ""
    }

    const vapidKey =
      process.env
        .NEXT_PUBLIC_FIREBASE_VAPID_KEY

    console.log(
      "Étape 4 : VAPID présente =",
      Boolean(vapidKey)
    )

    if (!vapidKey) {
      return ""
    }

    const permission =
      await Notification.requestPermission()

    console.log(
      "Étape 5 : permission =",
      permission
    )

    if (
      permission !== "granted"
    ) {
      return ""
    }

    console.log(
      "Étape 6 : enregistrement du service worker"
    )

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      )

    console.log(
      "Étape 7 : service worker enregistré",
      registration
    )

    const readyRegistration =
      await navigator.serviceWorker.ready

    console.log(
      "Étape 8 : service worker actif",
      readyRegistration.active
    )

    console.log(
      "Étape 9 : initialisation Messaging"
    )

    const messaging =
      getMessaging(firebaseApp)

    console.log(
      "Étape 10 : appel getToken"
    )

    const token =
      await getToken(
        messaging,
        {
          vapidKey,
          serviceWorkerRegistration:
            readyRegistration
        }
      )

    console.log(
      "Étape 11 : token récupéré",
      token
    )

    return token || ""
  } catch (error) {
    console.error(
      "ERREUR FCM EXACTE :",
      error
    )

    if (
      error instanceof Error
    ) {
      console.error(
        "Nom :",
        error.name
      )

      console.error(
        "Message :",
        error.message
      )

      console.error(
        "Stack :",
        error.stack
      )
    }

    return ""
  }
}
