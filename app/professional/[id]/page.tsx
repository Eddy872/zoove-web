import ProfessionalClientPage from "./ProfessionalClientPage"
import "./ProfessionalPage.css"

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function ProfessionalPage({ params }: Props) {
  const { id } = await params

  return (
    <main className="proPage">
      <ProfessionalClientPage id={id} />
    </main>
  )
}
