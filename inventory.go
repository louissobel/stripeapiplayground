package main

type Zine struct {
	Id            string `json:"id"`
	Author        string `json:"author"`
	Title         string `json:"title"`
	Edition       string `json:"edition"`
	PriceAmount   int    `json:"price_amount"`
	PriceCurrency string `json:"price_currency"`
	Icon          string `json:"icon"`
}

func LoadZine(id string) (Zine, bool, error) {
	zines, err := LoadZines()
	if err != nil {
		return Zine{}, false, err
	}
	for _, zine := range zines {
		if zine.Id == id {
			return zine, true, nil
		}
	}
	return Zine{}, false, nil
}

func LoadZines() ([]Zine, error) {
	zines := []Zine{
		{
			Id:            "1",
			Author:        "Louis",
			Title:         "Dublin Weather Report",
			Edition:       "April 2019",
			PriceAmount:   504,
			PriceCurrency: "eur",
			Icon:          "🌧",
		},
		{
			Id:            "2",
			Author:        "Louis",
			Title:         "Dublin Weather Report",
			Edition:       "March 2019",
			PriceAmount:   503,
			PriceCurrency: "eur",
			Icon:          "🌧",
		},
		{
			Id:            "3",
			Author:        "Louis",
			Title:         "Dublin Weather Report",
			Edition:       "February 2019",
			PriceAmount:   502,
			PriceCurrency: "eur",
			Icon:          "🌧",
		},
		{
			Id:            "4",
			Author:        "Louis",
			Title:         "Dublin Weather Report",
			Edition:       "January 2019",
			PriceAmount:   100,
			PriceCurrency: "eur",
			Icon:          "🌧",
		},
	}

	return zines, nil
}
