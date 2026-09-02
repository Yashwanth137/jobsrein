"""
Text extraction utilities.

Stage 1 of the pipeline: deterministic text extraction from PDF files
and web URLs. No LLM involvement at this stage.
"""

import io
import requests
from utils.logger import logger


def extract_pdf_text(file_bytes: bytes) -> str:
    """
    Extract plain text from a PDF file using pdfplumber.

    Args:
        file_bytes: Raw bytes of the uploaded PDF file.

    Returns:
        Concatenated text from all pages, separated by newlines.

    Raises:
        ValueError: If no text could be extracted.
    """
    import pdfplumber

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    full_text = "\n\n".join(text_parts).strip()
    if not full_text:
        raise ValueError("Could not extract any text from the PDF. "
                         "The file may be image-based or empty.")

    logger.info(f"Extracted {len(full_text)} characters from PDF ({len(text_parts)} pages)")
    return full_text


def extract_url_text(url: str) -> str | None:
    """
    Best-effort text extraction from a URL.

    Uses requests + BeautifulSoup to fetch and extract readable text.
    Returns None on any failure — the caller should fall back to
    asking the user to paste the JD text directly.

    Args:
        url: The job posting URL.

    Returns:
        Extracted text content, or None if extraction failed.
    """
    try:
        from bs4 import BeautifulSoup

        headers = {
            "User-Agent": ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                           "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove script, style, nav, header, footer elements
        for element in soup(["script", "style", "nav", "header", "footer",
                             "aside", "form", "button", "iframe"]):
            element.decompose()

        # Extract text
        text = soup.get_text(separator="\n", strip=True)

        # Clean up excessive whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = "\n".join(lines)

        if len(clean_text) < 100:
            logger.warning(f"URL extraction returned very little text ({len(clean_text)} chars)")
            return None

        logger.info(f"Extracted {len(clean_text)} characters from URL: {url}")
        return clean_text

    except Exception as e:
        logger.warning(f"URL text extraction failed for {url}: {e}")
        return None
