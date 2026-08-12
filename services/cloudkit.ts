declare global {
  interface Window {
    CloudKit: any
  }
}

export async function loadCloudKit() {
  if (window.CloudKit) return window.CloudKit

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://cdn.apple-cloudkit.com/ck/2/cloudkit.js"
    script.onload = () => resolve()
    script.onerror = () => reject()
    document.body.appendChild(script)
  })

  return window.CloudKit
}

export async function configureCloudKit() {
  const CloudKit = await loadCloudKit()

  CloudKit.configure({
    containers: [
      {
        containerIdentifier: "iCloud.Zoove",
        environment:
          process.env.NEXT_PUBLIC_CLOUDKIT_ENV === "production"
            ? "production"
            : "development",
        apiTokenAuth: {
          apiToken: "2b1bc21f6f4fad1f63f1c64f2032a4eb657a74af2c248297a023cf27bcc88cdc",
          persist: false
        }
      }
    ]
  })

  const container = CloudKit.getDefaultContainer()
  return container.publicCloudDatabase
}
