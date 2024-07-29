package JwtTokens

import (
	"authentication/DTO"
	"authentication/Env"
	"fmt"
	"github.com/golang-jwt/jwt/v4"
	"time"
)

type claimStruct struct {
	Login    string `json:"login"`
	Password string `json:"password"`
	jwt.RegisteredClaims
}

func GenerateJWTToken(login, password string) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["login"] = login
	claims["password"] = password
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()

	secretKey := []byte(Env.Envfile.JWT_KEY)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func ParseJWTToken(jwtToken string) (DTO.UserDTO, error) {
	var claims claimStruct

	token, err := jwt.ParseWithClaims(jwtToken, &claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(Env.Envfile.JWT_KEY), nil
	})

	if err != nil {
		return DTO.UserDTO{}, fmt.Errorf("error parsing token: %v", err)
	}

	if !token.Valid {
		return DTO.UserDTO{}, fmt.Errorf("invalid token")
	}

	return DTO.UserDTO{
		Login:    claims.Login,
		Password: claims.Password,
	}, nil
}
