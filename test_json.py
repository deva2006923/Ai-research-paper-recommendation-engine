import json
import re

def sanitize_json(text: str) -> str:
    text = re.sub(r',\s*([\]}])', r'\1', text)
    in_string = False
    escape = False
    result = []
    for char in text:
        if in_string:
            if escape:
                if char in '"\\/bfnrtu':
                    result.append('\\' + char)
                else:
                    result.append('\\\\' + char)
                escape = False
            elif char == '\\':
                escape = True
            elif char == '"':
                in_string = False
                result.append(char)
            elif char == '\n':
                result.append('\\n')
            elif char == '\t':
                result.append('\\t')
            else:
                result.append(char)
        else:
            if char == '"':
                in_string = True
            result.append(char)
    # If the string ended while still escaping, append the backslash
    if escape:
        result.append('\\\\')
    return "".join(result)

print(sanitize_json('{\n  "a": "b\\escape",\n  "c": "d\ne"\n}'))
print(json.loads(sanitize_json('{\n  "a": "b\\escape",\n  "c": "d\ne"\n}')))
