package utils

import "strings"

func GenerateSubdomain(projectName string) string {
	var slug strings.Builder
	lastWasHyphen := false
	for i := 0; i < len(projectName); i++ {
		c := projectName[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') {
			slug.WriteByte(c)
			lastWasHyphen = false
			continue
		}
		if slug.Len() > 0 && !lastWasHyphen {
			slug.WriteByte('-')
			lastWasHyphen = true
		}
	}
	return strings.Trim(slug.String(), "-")
}
