const types = ['string', 'number', '8', 'U8', '16', 'U16', '32', 'U32', 'F32', 'F64']

export const validateReturnType = (name, ret) => {
  const validReturnType = types.some(type => type === ret)

  if (!validReturnType) {
    throw new Error(
      `failed to register the '${name}' function. ` +
      `Invalid return type: ${ret}.`
    )
  }
}

export const validateArgTypes = (name, argTypes) => {
  if (!Array.isArray(argTypes)) {
    throw new Error(
      `failed to register the '${name}' function. ` +
      "The 'args' field must be an array."
    )
  }

  const invalidArgTypes = new Set()

  argTypes.forEach(argType => {
    const validArgType = types.some(type => type === argType)

    if (!validArgType) invalidArgTypes.add(argType)
  })

  if (invalidArgTypes.size) {
    throw new Error(
      `failed to register the '${name}' function. ` +
      `The following argument types aren't supported: ${
        [...invalidArgTypes].join(', ')
      }`
    )
  }
}
