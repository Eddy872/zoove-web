import AppointmentClientPage from "./AppointmentClientPage"

export default async function AppointmentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AppointmentClientPage id={id} />
}
