package project

import "errors"

// Sentinel errors for the project service.
// Handlers should check against these with errors.Is to map them
// to the correct HTTP status codes instead of always returning 500.
var (
	// ErrForbidden is returned when an authenticated user attempts an
	// action on a resource they do not own.
	ErrForbidden = errors.New("forbidden: user does not own this resource")

	// ErrNotFound is returned when a requested resource does not exist.
	ErrNotFound = errors.New("not found")
)
