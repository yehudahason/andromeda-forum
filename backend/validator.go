package main

import "errors"

func validateUser(user Task) error {
	if user.Name == "" {
		return errors.New("Name is required")
	}

	if user.Email == "" {
		return errors.New("Email is required")
	}

	if user.Task == "" {
		return errors.New("Task is required")
	}

	if user.Completed == nil {
		return errors.New("Completed is required")
	}

	return nil
}
