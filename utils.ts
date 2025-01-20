type NumberArray = number[] | ArrayLike<number>;

export function prettyHex(nr: number): string;
export function prettyHex(nr: NumberArray): string[];
export function prettyHex(nrOrArray: number | NumberArray) {
  if (Array.isArray(nrOrArray)) {
    return nrOrArray.map((nr) => prettyHex(nr));
  }
  if (ArrayBuffer.isView(nrOrArray)) {
    return prettyHex(Array.from(nrOrArray as NumberArray));
  }
  if (typeof nrOrArray !== "number") {
    throw new Error("Unsupported type");
  }

  return `0x${nrOrArray.toString(16)}`;
}
/**
 * DataUnit enum sizes in bytes
 */
export enum ByteDataUnit {
  /** 4 Bytes, 32 bits */
  Word = 4,
  /** 2 Bytes, 16 bits */
  HalfWord = 2,
  /** 1 Byte, 8 bits */
  Byte = 1,

  // Bit = 1 / 8,
}

/**
 * Whether a value should be signed or unsigned
 */
export enum Signedness {
  /** Signed */
  Signed,
  /** Unsigned */
  Unsigned,
}

export class LittleEndianStorage {
  /** The simulated start address of the storage */
  private startAddress: number;
  /** The data stored in the storage in bytes */
  private data: Uint8Array;

  constructor({
    startAddress,
    data,
  }: {
    startAddress: number;
    data: number[];
  }) {
    this.startAddress = startAddress;
    const dataUint8 = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      if (data[i] > 0xff) {
        throw new Error(`Data at index ${i} is larger than 1 byte`);
      }
      dataUint8[i] = data[i];
    }

    this.data = dataUint8;
  }

  public readData({
    address,
    readLength,
    dataUnit,
    signedness,
  }: {
    address: number;
    readLength: number;
    dataUnit: ByteDataUnit;
    signedness: Signedness;
  }) {
    const totalByesReadLen = dataUnit * readLength;
    const actualAddress = address - this.startAddress;

    if (totalByesReadLen > 4) {
      throw new Error(
        "Cannot read more than 4 bytes, because bitwise operations are limited to 32 bits in JS"
      );
    }

    const data = this.data.slice(
      actualAddress,
      actualAddress + totalByesReadLen
    );
    // parse little endian data to a value
    let value = 0;

    for (let i = 0; i < data.length; i++) {
      value |= data[i] << (i * 8);
    }

    // force unsigned interpretation in case we worked with 4 bytes and JS auto signed the value
    value = value >>> 0;

    if (signedness === Signedness.Signed) {
      const msbMask = 0xff_ff_ff_ff << (totalByesReadLen * 8 - 1);
      if ((value & msbMask) !== 0) {
        value = value | msbMask;
      }
    }

    return { value, dataSection: prettyHex(data) };
  }
}
