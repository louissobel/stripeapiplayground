package main

import (
	"fmt"
	"math"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/labstack/gommon/log"

	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/checkout/session"
	"github.com/stripe/stripe-go/customer"
	"github.com/stripe/stripe-go/paymentintent"
	"github.com/stripe/stripe-go/paymentmethod"
	"github.com/stripe/stripe-go/setupintent"
)

type CreateUserRequest struct {
	Username string `form:"username"`
}

type CreatePaymentIntentRequest struct {
	ZineID     string `json:"zine"`
	CustomerID string `json:"customer"`
}

type LoadPaymentIntentRequest struct {
	ID string `json:"id"`
}

type CancelPaymentIntentRequest struct {
	ID string `json:"id"`
}

type CreateSetupIntentRequest struct {
	CustomerID string `json:"customer"`
}

type CancelSetupIntentRequest struct {
	ID string `json:"id"`
}

type SavePaymentMethodToCustomerFromSetupIntentRequest struct {
	SetupIntentID string `json:"setup_intent"`
}

type CreateCheckoutSetupSessionRequest struct {
	CustomerID string `json:"customer"`
}

type FinishCheckoutSetupSessionRequest struct {
	SessionID string `query:"session"`
}

type FinalizePaymentIntentRequest struct {
	ID string `json:"id"`
}

type DownloadZineRequest struct {
	PaymentIntentID string `query:"pi"`
	Key             string `query:"key"`
}

type CustomerDataRequest struct {
	ID string `query:"id"`
}

type CustomerData struct {
	ID                 string                  `json:"id"`
	CardPaymentMethods []*stripe.PaymentMethod `json:"card_payment_methods"`
}

const BASE_URL = "http://localhost:3000"

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Logger.SetLevel(log.DEBUG)

	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

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

	e.POST("/api/load_payment_intent", func(c echo.Context) error {
		r := new(LoadPaymentIntentRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		paymentIntent, err := loadPaymentIntent(r)
		if err != nil {
			return err
		}
		fmt.Printf("loaded payment intent: %v\n", paymentIntent)
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

	e.POST("/api/create_setup_intent", func(c echo.Context) error {
		r := new(CreateSetupIntentRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		setupIntent, err := createSetupIntent(r)
		if err != nil {
			return err
		}
		fmt.Printf("created setup intent: %v\n", setupIntent)
		return c.JSON(http.StatusOK, setupIntent)
	})

	e.POST("/api/cancel_setup_intent", func(c echo.Context) error {
		r := new(CancelSetupIntentRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		err = cancelSetupIntent(r)
		if err != nil {
			return err
		}
		fmt.Printf("canceled setupintent intent: %v\n", r)
		return c.JSON(http.StatusOK, map[string]string{"id": r.ID})
	})

	e.POST("/api/save_payment_method_to_customer_from_setup_intent", func(c echo.Context) error {
		r := new(SavePaymentMethodToCustomerFromSetupIntentRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		err = savePaymentMethodToCustomerFromSetupIntent(r)
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, nil)
	})

	e.POST("/api/create_checkout_setup_session", func(c echo.Context) error {
		r := new(CreateCheckoutSetupSessionRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		s, err := createCheckoutSetupSession(r)
		if err != nil {
			return err
		}

		fmt.Printf("Created CheckoutSession: %v\n", s)
		return c.JSON(http.StatusOK, map[string]string{
			"id": s.ID,
		})
	})

	e.GET("/api/finish_checkout_setup_session", func(c echo.Context) error {
		r := new(FinishCheckoutSetupSessionRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		customerID, err := finishCheckoutSetupSession(r)
		if err != nil {
			return err
		}

		return c.Redirect(http.StatusSeeOther, fmt.Sprintf("/logged_in_as/%s", customerID))
	})

	e.GET("/api/customer_data", func(c echo.Context) error {
		r := new(CustomerDataRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		data, err := customerData(r)
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, data)
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
		PaymentMethodTypes: stripe.StringSlice([]string{
			"card",
			"ideal",
		}),
		Amount:   stripe.Int64(int64(zine.PriceAmount)),
		Currency: stripe.String(zine.PriceCurrency),
		TransferData: &stripe.PaymentIntentTransferDataParams{
			Destination: stripe.String(zine.Account),
		},
		ApplicationFeeAmount: stripe.Int64(int64(computeApplicationFeeAmount(zine.PriceAmount))),
		Params: stripe.Params{
			Metadata: map[string]string{
				"zine": r.ZineID,
			},
		},
	}
	if r.CustomerID != "" {
		params.Customer = stripe.String(r.CustomerID)
	}
	return paymentintent.New(params)
}

func loadPaymentIntent(r *LoadPaymentIntentRequest) (*stripe.PaymentIntent, error) {
	return paymentintent.Get(r.ID, nil)
}

func cancelPaymentIntent(r *CancelPaymentIntentRequest) error {
	_, err := paymentintent.Cancel(r.ID, nil)
	return err
}

func finalizePaymentIntent(r *FinalizePaymentIntentRequest) (string, error) {
	return fulfillPaymentIntent(r.ID)
}

func createSetupIntent(r *CreateSetupIntentRequest) (*stripe.SetupIntent, error) {
	params := &stripe.SetupIntentParams{
		Customer: stripe.String(r.CustomerID),
	}
	return setupintent.New(params)
}

func cancelSetupIntent(r *CancelSetupIntentRequest) error {
	_, err := setupintent.Cancel(r.ID, nil)
	return err

}

func savePaymentMethodToCustomerFromSetupIntent(r *SavePaymentMethodToCustomerFromSetupIntentRequest) error {
	si, err := setupintent.Get(r.SetupIntentID, nil)
	if err != nil {
		return fmt.Errorf("error geting SetupIntent: %v", err)
	}

	if si.Customer == nil {
		return fmt.Errorf("SetupIntent %s has no customer", si.ID)
	}
	customerID := si.Customer.ID

	if si.PaymentMethod == nil {
		return fmt.Errorf("SetupIntent %s has no payment_method", si.ID)
	}
	paymentMethodID := si.PaymentMethod.ID

	err = attachPaymentMethodToCustomer(paymentMethodID, customerID)
	if err != nil {
		return err
	}

	fmt.Printf("attached! customerid: %s, paymentMethodID: %s\n", customerID, paymentMethodID)
	return nil
}

func createCheckoutSetupSession(r *CreateCheckoutSetupSessionRequest) (*stripe.CheckoutSession, error) {
	params := &stripe.CheckoutSessionParams{
		SuccessURL: stripe.String(
			fmt.Sprintf("%s/api/finish_checkout_setup_session?session={CHECKOUT_SESSION_ID}", BASE_URL),
		),
		CancelURL: stripe.String("http://localhost:3000/canceled_sad"),
		PaymentMethodTypes: stripe.StringSlice([]string{
			"card",
		}),
		Mode: stripe.String(string(stripe.CheckoutSessionModeSetup)),
		SetupIntentData: &stripe.CheckoutSessionSetupIntentDataParams{
			Params: stripe.Params{
				Metadata: map[string]string{
					"customer": r.CustomerID,
				},
			},
		},
	}
	return session.New(params)

}

func finishCheckoutSetupSession(r *FinishCheckoutSetupSessionRequest) (string, error) {
	fmt.Printf("finishing checkout session: %s\n", r.SessionID)

	params := &stripe.CheckoutSessionParams{}
	params.AddExpand("setup_intent")
	params.AddExpand("setup_intent.payment_method")
	s, err := session.Get(r.SessionID, params)
	if err != nil {
		return "", fmt.Errorf("error getting session")
	}

	if s.SetupIntent == nil {
		return "", fmt.Errorf("got nil setup intent for session %s", r.SessionID)
	}

	if s.SetupIntent.Status != stripe.SetupIntentStatusSucceeded {
		return "", fmt.Errorf("session setupintent (%s) in unexpected status %v", s.SetupIntent.ID, s.SetupIntent.Status)
	}

	customerID := s.SetupIntent.Metadata["customer"]
	if customerID == "" {
		return "", fmt.Errorf("no customer found in SetupIntent metadata for setup intent %s", s.SetupIntent.ID)
	}

	if s.SetupIntent.PaymentMethod == nil {
		return "", fmt.Errorf("setupintents payment method is unexpectedly nil: %s", s.SetupIntent.ID)
	}

	// This need also be idempotent given it's called from GET request

	if s.SetupIntent.PaymentMethod.Object == "" {
		// Protect against this not expanding properly by checking some other field...
		panic("did not properly expant payment method!")
	}

	if s.SetupIntent.PaymentMethod.Customer != nil {
		if s.SetupIntent.PaymentMethod.Customer.ID != customerID {
			return "", fmt.Errorf(
				"payment method (%s), already attached to unexpected customer: %s",
				s.SetupIntent.PaymentMethod.ID,
				s.SetupIntent.PaymentMethod.Customer,
			)
		}
		fmt.Printf("customer %s already attached to %s, doing nothing\n", customerID, s.SetupIntent.PaymentMethod.ID)
		return customerID, nil
	}

	fmt.Printf(
		"finishing session with setupintent %s, customer %s, payment_method %s\n",
		s.SetupIntent.ID,
		customerID,
		s.SetupIntent.PaymentMethod.ID,
	)
	err = attachPaymentMethodToCustomer(s.SetupIntent.PaymentMethod.ID, customerID)
	if err != nil {
		return "", err
	}

	return customerID, nil
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

func attachPaymentMethodToCustomer(paymentMethod, customer string) error {
	params := &stripe.PaymentMethodAttachParams{
		Customer: stripe.String(customer),
	}
	_, err := paymentmethod.Attach(paymentMethod, params)
	if err != nil {
		return fmt.Errorf("error attaching %s to %s: %v", paymentMethod, customer, err)
	}
	return nil
}

func customerData(r *CustomerDataRequest) (CustomerData, error) {
	// Get card payment methods
	pms := []*stripe.PaymentMethod{}

	params := &stripe.PaymentMethodListParams{}
	params.Filters.AddFilter("customer", "", r.ID)
	params.Filters.AddFilter("type", "", "card")
	i := paymentmethod.List(params)
	for i.Next() {
		pms = append(pms, i.PaymentMethod())
	}

	return CustomerData{
		ID:                 r.ID,
		CardPaymentMethods: pms,
	}, nil
}

func computeApplicationFeeAmount(chargeAmount int) int {
	// Flat 5%, round down to be nice
	return int(math.Floor(float64(chargeAmount) * 0.05))
}
