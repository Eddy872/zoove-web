importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
)

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
)


firebase.initializeApp({
  apiKey:
    "AIzaSyDSftrTH8p8SfM-8kN5CSWje30amMo5Ak4",

  authDomain:
    "zoove-5710e.firebaseapp.com",

  projectId:
    "zoove-5710e",

  storageBucket:
    "zoove-5710e.firebasestorage.app",

  messagingSenderId:
    "701410289685",

  appId:
    "1:701410289685:web:97302835886850923bc61c"
})


const messaging =
  firebase.messaging()


messaging.onBackgroundMessage(
  (payload) => {

    console.log(
      "🔔 Notification reçue en arrière-plan :",
      payload
    )


    const title =
      payload.notification?.title ||
      "Zoove"

    const body =
      payload.notification?.body ||
      ""


    self.registration.showNotification(
      title,
      {
        body,

        icon:
          "/icons/icon-192.png",

        badge:
          "/icons/icon-192.png",

        data: {
          ...payload.data,

          url:
            payload.data?.url ||
            "/"
        }
      }
    )
  }
)


self.addEventListener(
  "notificationclick",
  (event) => {

    console.log(
      "🔔 Clic notification :",
      event.notification.data
    )


    event.notification.close()


    const url =
      event.notification.data?.url ||
      "/"


    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then(
          (clientList) => {

            for (
              const client of clientList
            ) {

              if (
                "focus" in client
              ) {

                client.navigate(url)

                return client.focus()
              }
            }


            if (
              clients.openWindow
            ) {
              return clients.openWindow(
                url
              )
            }
          }
        )
    )
  }
)
