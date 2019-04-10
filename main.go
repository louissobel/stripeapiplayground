package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/labstack/gommon/log"

	"github.com/google/uuid"
	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/customer"
	"github.com/stripe/stripe-go/paymentIntent"
)

type CreateUserRequest struct {
	Username string `form:"username"`
}

type CreatePaymentIntentRequest struct {
	ZineID string `json:"zine"`
}

type CancelPaymentIntentRequest struct {
	ID string `json:"id"`
}

type FinalizePaymentIntentRequest struct {
	ID string `json:"id"`
}

type DownloadZineRequest struct {
	PaymentIntentID string `query:"pi"`
	Key             string `query:"key"`
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Logger.SetLevel(log.DEBUG)

	stripe.Key = "sk_test_CLfNzxNaOJzM89z5BdKcGgZ400ioS5gsib"

	e.POST("/api/create_user", func(c echo.Context) error {
		r := new(CreateUserRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		id, err := createUser(r)
		if err != nil {
			return err
		}
		fmt.Printf("created user: %s\n", id)
		return c.Redirect(http.StatusSeeOther, fmt.Sprintf("/logged_in_as/%s", id))
	})

	e.GET("/api/list_of_users", func(c echo.Context) error {
		users, err := fetchUsers()
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, users)
	})

	e.GET("/api/zines", func(c echo.Context) error {
		zines, err := LoadZines()
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, zines)
	})

	e.POST("/api/create_payment_intent", func(c echo.Context) error {
		r := new(CreatePaymentIntentRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		paymentIntent, err := createPaymentIntent(r)
		if err != nil {
			return err
		}
		fmt.Printf("created payment intent: %v\n", paymentIntent)
		return c.JSON(http.StatusOK, paymentIntent)
	})

	e.POST("/api/cancel_payment_intent", func(c echo.Context) error {
		r := new(CancelPaymentIntentRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		err = cancelPaymentIntent(r)
		if err != nil {
			return err
		}
		fmt.Printf("canceled payment intent: %v\n", r)
		return c.JSON(http.StatusOK, map[string]string{"id": r.ID})
	})

	e.POST("/api/finalize_payment_intent", func(c echo.Context) error {
		r := new(FinalizePaymentIntentRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		fulfillmentURL, err := finalizePaymentIntent(r)
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, map[string]string{
			"fulfillment_url": fulfillmentURL,
		})
	})

	e.GET("/download_zine", func(c echo.Context) error {
		r := new(DownloadZineRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		pi, err := paymentintent.Get(r.PaymentIntentID, nil)
		if err != nil {
			return err
		}

		zineID := pi.Metadata["zine"]
		if zineID == "" {
			return fmt.Errorf("no zine found on %s", pi.ID)
		}

		zine, ok, err := LoadZine(zineID)
		if err != nil {
			return err
		}
		if !ok {
			return fmt.Errorf("no zine found with id %s", zineID)
		}

		pdf, err := RenderPDF(fmt.Sprintf(
			"%s — %s — %s",
			zine.Author,
			zine.Title,
			zine.Edition,
		))
		if err != nil {
			return err
		}
		return c.Blob(http.StatusOK, "application/pdf", pdf)
	})
	e.Logger.Fatal(e.Start(":1323"))
}

func createUser(r *CreateUserRequest) (string, error) {
	params := &stripe.CustomerParams{
		Params: stripe.Params{
			Metadata: map[string]string{
				"username": r.Username,
			},
		},
	}
	customer, err := customer.New(params)
	if err != nil {
		return "", err
	}

	return customer.ID, nil
}

func fetchUsers() ([]*stripe.Customer, error) {
	out := []*stripe.Customer{}
	i := customer.List(&stripe.CustomerListParams{})
	for i.Next() {
		out = append(out, i.Customer())
	}
	return out, nil
}

func createPaymentIntent(r *CreatePaymentIntentRequest) (*stripe.PaymentIntent, error) {
	zine, ok, err := LoadZine(r.ZineID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, fmt.Errorf("no Zine found with id %s", r.ZineID)
	}
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(int64(zine.PriceAmount)),
		Currency: stripe.String(zine.PriceCurrency),
		Params: stripe.Params{
			Metadata: map[string]string{
				"zine": r.ZineID,
			},
		},
	}
	return paymentintent.New(params)
}

func cancelPaymentIntent(r *CancelPaymentIntentRequest) error {
	_, err := paymentintent.Cancel(r.ID, nil)
	return err

}

func finalizePaymentIntent(r *FinalizePaymentIntentRequest) (string, error) {
	return fulfillPaymentIntent(r.ID)
}

// Idempotently fulfills the payment intent
func fulfillPaymentIntent(id string) (string, error) {
	// Load it and make sure it's actually success!
	pi, err := paymentintent.Get(id, nil)
	if err != nil {
		return "", fmt.Errorf("error getting PaymentIntent: %v", err)
	}

	if pi.Status != "succeeded" {
		return "", fmt.Errorf("cannot fulfill payment intent with status %v", pi.Status)
	}

	if pi.Metadata["fulfillment_url"] != "" {
		// Fine, it's already been fulfilled!
		return pi.Metadata["fulfillment_url"], nil
	}

	// Ok, now I get to fulfill. Of course, there might be a race condition here,
	// but having multiple fulfillment URLs is fine.....
	// The uuid makes it look random....
	url := fmt.Sprintf("/download_zine?pi=%s&key=%s", pi.ID, uuid.New().String())

	params := &stripe.PaymentIntentParams{}
	params.AddMetadata("fulfillment_url", url)
	_, err = paymentintent.Update(pi.ID, params)
	if err != nil {
		return "", err
	}

	return url, nil
}
