import "./CategoryButtons.css"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"

import {
  Scissors,
  Dog,
  Stethoscope,
  Bone,
  Brain,
  GraduationCap,
  Apple
} from "lucide-react"

type Props = {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export default function CategoryButtons({
  selectedCategory,
  onSelectCategory
}: Props) {
    const { language } = useLanguage()
  const categories = [
    { name: "Toiletteur", icon: Scissors },
    { name: "Pet Sitter", icon: Dog },
    { name: "Vétérinaire", icon: Stethoscope },
    { name: "Ostéopathe", icon: Bone },
    { name: "Comportementaliste", icon: Brain },
    { name: "Éducateur", icon: GraduationCap },
    { name: "Nutrition", icon: Apple }
  ]

  return (
    <section className="categories">
      {categories.map((category) => {
        const Icon = category.icon
        const isActive = selectedCategory === category.name

        return (
          <button
            key={category.name}
            className={`categoryButton ${isActive ? "active" : ""}`}
            onClick={() =>
              onSelectCategory(isActive ? "" : category.name)
            }
          >
            <Icon size={18} />
                <span>{translate(language, category.name)}</span>
          </button>
        )
      })}
    </section>
  )
}
