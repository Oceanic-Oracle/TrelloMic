package JwtTokens

import (
	"authentication/Env"
	"github.com/golang-jwt/jwt/v4"
	"time"
)

func GenerateJWTToken(login, password string) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["login"] = login
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()

	secretKey := []byte(Env.Envfile.JWT_KEY)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
