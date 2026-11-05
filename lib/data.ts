export const products = [
  {
    slug: "single-jet",
    name: "Single-Jet Water Meter",
    short: "Compact precision for everyday flow.",
    image: "/assets/optimized/single-jet.webp",
    sizes: "DN15 / DN20 / DN25",
    applications: "Domestic, industrial and agricultural applications",
    features: [
      "Magnetic dry dial",
      "Metrological Class B",
      "Corrosion-resistant body",
      "Maximum working temperature 30°C",
      "Brass and stainless-steel body options"
    ],
    technical: [
      ["Normal size", "15 mm", "20 mm", "25 mm"],
      ["Maximum flow (Q4)", "3 m³/hr", "5 m³/hr", "7 m³/hr"],
      ["Continuous flow (Q3)", "1.5 m³/hr", "2.5 m³/hr", "3.5 m³/hr"],
      ["Working pressure", "1.6 Mpa", "1.6 Mpa", "1.6 Mpa"],
      ["Temperature", "30°C", "30°C", "30°C"]
    ]
  },
  {
    slug: "multi-jet",
    name: "Multi-Jet Water Meter",
    short: "Reliable measurement across varied flow conditions.",
    image: "/assets/optimized/multi-jet.webp",
    sizes: "DN15 / DN20 / DN25 / DN40",
    applications: "Domestic, industrial and agricultural applications",
    features: [
      "Metrological R-100",
      "Magnetic dry dial",
      "Internal filter",
      "Corrosion-resistant body",
      "Maximum working temperature up to 50°C"
    ],
    technical: [
      ["Normal size", "15 mm", "20 mm", "25 mm", "40 mm"],
      ["Maximum flow (Q4)", "3.125 m³/hr", "5 m³/hr", "7.875 m³/hr", "20 m³/hr"],
      ["Continuous flow (Q3)", "2.5 m³/hr", "4 m³/hr", "6.3 m³/hr", "16 m³/hr"],
      ["Working pressure", "1.0/1.6 Mpa", "1.0/1.6 Mpa", "1.0/1.6 Mpa", "1.0/1.6 Mpa"],
      ["Temperature", "T50/T90", "T50/T90", "T50/T90", "T50/T90"]
    ]
  },
  {
    slug: "woltman",
    name: "Woltman Type Water Meter",
    short: "High-flow metering for larger installations.",
    image: "/assets/optimized/woltman.webp",
    sizes: "DN50 / DN65 / DN80 / DN100 / DN150 / DN200",
    applications: "Domestic, industrial and agricultural applications",
    features: [
      "Magnetic dry dial",
      "Metrological Class B",
      "Interchangeable measuring mechanism",
      "Corrosion-resistant body",
      "Available from DN50 to DN200"
    ],
    technical: [
      ["Normal size", "50 mm", "65 mm", "80 mm", "100 mm", "150 mm", "200 mm"],
      ["Nominal flow (Qn)", "15", "25", "40", "60", "150", "250"],
      ["Maximum pressure", "PN16", "PN16", "PN16", "PN16", "PN16", "PN16"],
      ["Temperature", "40°C cold / 90°C hot", "40°C cold / 90°C hot", "40°C cold / 90°C hot", "40°C cold / 90°C hot", "40°C cold / 90°C hot", "40°C cold / 90°C hot"]
    ]
  }
] as const;

export const applications = [
  {
    name: "Residential",
    image: "/assets/optimized/home-residential.webp",
    description: "Dependable metering for everyday water usage and smaller supply lines.",
    products: "Single-Jet / Multi-Jet"
  },
  {
    name: "Commercial",
    image: "/assets/optimized/home-commercial.webp",
    description: "Water-use monitoring for offices, shops and shared building services, with selection based on the demand of each supply line.",
    products: "Discuss building demand with our team"
  },
  {
    name: "Agricultural",
    image: "/assets/optimized/home-agricultural.webp",
    description: "Reliable measurement for irrigation and agricultural water distribution applications.",
    products: "Single-Jet / Multi-Jet / Woltman"
  },
  {
    name: "Industrial",
    image: "/assets/optimized/home-industrial.webp",
    description: "Metering solutions across a wider range of pipe sizes and flow requirements.",
    products: "Multi-Jet / Woltman"
  }
] as const;

export const contact = {
  address: "Shop No. 4, Ground Floor, Soor II, Latibazar, Navyug Colony, Bhulabhai Park, Ahmedabad-380022, Gujarat",
  email: "Support@sinkronmeters.com",
  website: "www.sinkronmeters.com",
  phones: ["+91 93277 03738"]
};
