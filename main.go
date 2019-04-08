package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/labstack/gommon/log"

	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/customer"
	"github.com/stripe/stripe-go/paymentIntent"
)

type CreateUserRequest struct {
	Username string `form:"username"`
}

type CreatePaymentIntentRequest struct {
	Amount   int    `json:"amount"`
	Currency string `json:"currency"`
}

type CancelPaymentIntentRequest struct {
	ID string `json:"id"`
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Logger.SetLevel(log.DEBUG)

	stripe.Key = "sk_test_CLfNzxNaOJzM89z5BdKcGgZ400ioS5gsib"

	e.POST("/create_user", func(c echo.Context) error {
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

	e.GET("/list_of_users", func(c echo.Context) error {
		users, err := fetchUsers()
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, users)
	})

	e.POST("/create_payment_intent", func(c echo.Context) error {
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

	e.POST("/cancel_payment_intent", func(c echo.Context) error {
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
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(int64(r.Amount)),
		Currency: stripe.String(r.Currency),
	}
	return paymentintent.New(params)
}

func cancelPaymentIntent(r *CancelPaymentIntentRequest) error {
	_, err := paymentintent.Cancel(r.ID, nil)
	return err

}
