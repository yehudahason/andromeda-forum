package main

import (
	"fmt"
)

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

var users = []User{
	{ID: 1, Name: "John", Email: "john@example.com"},
	{ID: 2, Name: "Jane", Email: "jane@example.com"},
	{ID: 3, Name: "Jane2", Email: "jane@example.com"},
	{ID: 4, Name: "Jane3", Email: "jane@example.com"},
}

func main() {
	id := 4
	for i, user := range users {
		if user.ID == id {
			users = append(users[:i], users[i+1:]...)

			fmt.Printf("ge-%v:arr-%v", user.ID, users)
			return
		}
	}

}
