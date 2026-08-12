export const professionals = [
  {
    id: "julie-martin",
    type: "Sitter",
    name: "Julie Martin",
    phoneNumber: "06 12 34 56 78",
    city: "Marseille",
    country: "France",
    image: "/images/demo1.jpg",
    photos: ["/images/demo1.jpg"],
    speciality: "Pet Sitter",
    skill: 4.8,
    fiability: 4.9,
    engagement: 4.7,
    affinity: 4.9,
    buyers: [],
    price: 15,
    devise: "€",
    acceptedSpecies: ["dog", "cat", "rabbit"],
    availability: ["Lundi 08:30-19:00", "Mardi 08:30-19:00", "Mercredi 08:30-19:00"],
    token: "",
    language: "fr",
    notifs: [],
    paypalID: "",
    services: [
        "garde",
        "visites",
        "promenades",
        "hebergement",
        "transport"
    ],
    feedbacks: [],
    rating: 4.9,
    description:
      "Pet sitter passionnée, je propose des gardes à domicile, des promenades et un suivi personnalisé pour chaque animal."
  },

  {
    id: "toilettage-canin-sud",
    type: "Grooming",
    name: "Toilettage Canin Sud",
    city: "Marseille",
    country: "France",
    adress: "42 Avenue du Prado, 13008 Marseille",
    phoneNumber: "04 91 12 34 56",
    image: "/images/demo2.jpg",
    photos: ["/images/demo2.jpg", "/images/demo1.jpg", "/images/demo3.jpg"],
    speciality: "Toiletteur",
    collaborators: ["Sophie", "Lucas"],
    collaboratorsDispos: ["Lundi", "Mardi"],
    schedules: ["Lundi 09:00-18:00", "Mardi 09:00-18:00"],
    services: [
      {
        id: "grooming-service-1",
        groomingID: "toilettage-canin-sud",
        name: "Toilettage complet",
        description: "Bain, coupe, démêlage et soin du pelage.",
        price: 45,
        duration: 60,
        devise: "€"
      }
    ],
    feedbacks: [
      {
        cleanRate: 4.9,
        frameRate: 4.8,
        homeRate: 4.7,
        qualityRate: 4.9,
        comment: "Très bon salon, accueil chaleureux.",
        date: "2026-07-01",
        groomingID: "toilettage-canin-sud",
        userID: "user-1"
      }
    ],
    informations:
      "Salon de toilettage pour chiens et chats proposant coupe, bain, démêlage et soins adaptés à chaque race.",
    userIDs: [],
    blockedUserIDs: [],
    device: "",
    badge: "Recommandé",
    rating: 4.8,
    description:
      "Salon de toilettage pour chiens et chats proposant coupe, bain, démêlage et soins adaptés à chaque race."
  },

  {
    id: "clinique-saint-barnabe",
    type: "Healthcare",
    name: "Clinique Saint-Barnabé",
    city: "Aix-en-Provence",
    country: "France",
    adress: "8 Boulevard Saint-Barnabé, 13100 Aix-en-Provence",
    phoneNumber: "04 42 98 76 54",
    image: "/images/demo3.jpg",
    photos: ["/images/demo3.jpg", "/images/demo1.jpg", "/images/demo2.jpg"],
    speciality: "Vétérinaire",
    expertise: ["Vétérinaire"],
    collaborators: ["Dr Martin", "Dr Bernard"],
    collaboratorsDispos: ["Lundi", "Mardi", "Mercredi"],
    schedules: ["Lundi 08:30-19:00", "Mardi 08:30-19:00", "Mercredi 08:30-19:00"],
    services: [
      {
        id: "healthcare-service-1",
        groomingID: "clinique-saint-barnabe",
        name: "Consultation vétérinaire",
        description: "Consultation générale pour chiens, chats et NAC.",
        price: 45,
        duration: 30,
        devise: "€"
      }
    ],
    feedbacks: [
      {
        cleanRate: 4.8,
        frameRate: 4.7,
        homeRate: 4.9,
        qualityRate: 4.8,
        comment: "Clinique sérieuse et professionnelle.",
        date: "2026-07-02",
        groomingID: "clinique-saint-barnabe",
        userID: "user-2"
      }
    ],
    informations:
      "Clinique vétérinaire assurant consultations, vaccinations, chirurgie et suivi médical des animaux de compagnie.",
    userIDs: [],
    blockedUserIDs: [],
    device: "",
    badge: "Ambassadeur",
    rating: 4.7,
    description:
      "Clinique vétérinaire assurant consultations, vaccinations, chirurgie et suivi médical des animaux de compagnie."
  }
]
