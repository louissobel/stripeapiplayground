package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/labstack/gommon/log"

	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/customer"
)

type CreateUserRequest struct {
	Username string `form:"username"`
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
