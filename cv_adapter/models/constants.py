# Typography-based line length constraints
BODY_LINE_LENGTH = 100  # Standard length for body text
TITLE_LINE_LENGTH = 50  # H1 - Main titles (like full name)
SUBTITLE_LINE_LENGTH = 60  # H2 - Section titles, company/university names
SUBSUBTITLE_LINE_LENGTH = 80  # H3 - Position titles, degrees, core competences
HALF_LINE_LENGTH = BODY_LINE_LENGTH // 2  # For short items like skills, locations

# Word and character ratios
AVG_CHARS_PER_WORD = 6  # Average number of characters per word including space
MAX_WORDS_PER_LINE = BODY_LINE_LENGTH // AVG_CHARS_PER_WORD  # ~16 words per line
MAX_WORDS_PER_SUBSUBTITLE = SUBSUBTITLE_LINE_LENGTH // AVG_CHARS_PER_WORD  # ~13 words

# Content length constraints in number of lines
MAX_EXPERIENCE_DESCRIPTION_LINES = 15  # 15 lines for detailed descriptions
MAX_CV_SUMMARY_LINES = 6  # 6 lines for CV summary

# Derived length constraints
MAX_EXPERIENCE_DESCRIPTION_LENGTH = BODY_LINE_LENGTH * MAX_EXPERIENCE_DESCRIPTION_LINES
MAX_CV_SUMMARY_LENGTH = BODY_LINE_LENGTH * MAX_CV_SUMMARY_LINES
MAX_CV_SUMMARY_WORDS = MAX_WORDS_PER_LINE * MAX_CV_SUMMARY_LINES

# List length constraints
MIN_CORE_COMPETENCES = 4
MAX_CORE_COMPETENCES = 6
MIN_SKILLS_IN_GROUP = 1
