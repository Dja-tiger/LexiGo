package auth

import "testing"

func TestPasswordHashRoundTrip(t *testing.T) {
	hash, err := HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}
	if !VerifyPassword(hash, "correct horse battery staple") {
		t.Fatal("expected password to match")
	}
	if VerifyPassword(hash, "wrong password") {
		t.Fatal("wrong password must not match")
	}
}
