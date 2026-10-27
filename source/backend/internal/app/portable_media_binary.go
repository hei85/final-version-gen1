package app

import (
	"os"
	"path/filepath"
)

func portableMediaBinary(name string) string {
	executable, err := os.Executable()
	if err != nil {
		return ""
	}
	root := filepath.Dir(filepath.Dir(executable))
	for _, pattern := range []string{
		filepath.Join(root, "runtime", "ffmpeg", "bin", name+".exe"),
		filepath.Join(root, "runtime", "h3-audio-audit", "ffmpeg", "*", "bin", name+".exe"),
	} {
		matches, _ := filepath.Glob(pattern)
		for index := len(matches) - 1; index >= 0; index-- {
			if info, err := os.Stat(matches[index]); err == nil && info.Mode().IsRegular() {
				return matches[index]
			}
		}
	}
	return ""
}
