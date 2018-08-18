const validArgTypes = ['string', 'number', '8', 'U8', '16', 'U16', '32', 'U32', 'F32', 'F64']

export const validateReturnType = (fnName, ret) => {
  const validReturnType = validArgTypes.some(type => type === ret)

  if (!validReturnType) {
    throw new Error(
      `failed to register the '${fnName}' function. ` +
      `Invalid return type: ${ret}.`
    )
  }
}

export const validateArgTypes = (fnName, argTypes) => {
  if (!Array.isArray(argTypes)) {
    throw new Error(
      `failed to register the '${fnName}' function. ` +
      "The 'args' field must be an array."
    )
  }

  const invalidArgTypes = new Set()

  argTypes.forEach(argType => {
    const validArgType = validArgTypes.some(type => type === argType)

    if (!validArgType) invalidArgTypes.add(argType)
  })

  if (invalidArgTypes.size) {
    throw new Error(
      `failed to register the '${fnName}' function. ` +
      `The following argument types aren't supported: ${
        [...invalidArgTypes].join(', ')
      }`
    )
  }
}
