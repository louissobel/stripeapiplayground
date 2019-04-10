package main

import (
	"bytes"

	"github.com/jung-kurt/gofpdf"
)

func RenderPDF(content string) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A5", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 10)
	tr := pdf.UnicodeTranslatorFromDescriptor("")
	pdf.Cell(40, 10, tr(content))

	var o bytes.Buffer
	err := pdf.Output(&o)
	if err != nil {
		return nil, err
	}
	return o.Bytes(), nil
}
