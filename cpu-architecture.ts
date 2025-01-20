import {
  prettyHex,
  LittleEndianStorage,
  ByteDataUnit,
  Signedness,
} from "./utils.ts";

{
  const littleEndianStorage = new LittleEndianStorage({
    startAddress: 0,
    data: [0x24, 0x65, 0xa6, 0xb7],
  });
  const readData = littleEndianStorage.readData({
    address: 0,
    readLength: 4,
    dataUnit: ByteDataUnit.Byte,
    signedness: Signedness.Unsigned,
  });
  console.log(prettyHex(readData.value));
}

function addressRange({
  fromAddress,
  amountOfBytes,
}: {
  fromAddress: number;
  amountOfBytes: number;
}) {
  const toAddress = fromAddress + (amountOfBytes - 1); // fencepost problem +1 = 2 addresses
  return { toAddress };
}

{
  const startAddress = 0x20001800;
  const byteLengths = [1024, 256, 512];

  const addrRanges = byteLengths.reduce<
    {
      fromAddress: number;
      toAddress: number;
    }[]
  >((acc, byteLength, idx) => {
    const fromAddress = idx === 0 ? startAddress : acc[idx - 1].toAddress + 1;
    const { toAddress } = addressRange({
      fromAddress,
      amountOfBytes: byteLength,
    });

    acc.push({ fromAddress, toAddress });
    return acc;
  }, []);

  console.log(
    addrRanges.map(({ fromAddress, toAddress }) => ({
      fromAddress: prettyHex(fromAddress),
      toAddress: prettyHex(toAddress),
    }))
  );
}

{
  const littleEndianData = [
    0x45, 0xe2, 0b01100010, 213, 25, 0x65, 0b10101101, 0xa3, 0x82, 0xa2, 34,
    0x54, 0xff, 0x92, 0x03,
  ];
  const startAddress = 0x2ffffff7;

  const storage = new LittleEndianStorage({
    startAddress,
    data: littleEndianData,
  });

  const dataReads = [
    storage.readData({
      address: 0x2ffffff8,
      readLength: 1,
      dataUnit: ByteDataUnit.HalfWord,
      signedness: Signedness.Signed,
    }),
    storage.readData({
      address: 0x2ffffffc,
      readLength: 1,
      dataUnit: ByteDataUnit.Word,
      signedness: Signedness.Unsigned,
    }),
    storage.readData({
      address: 0x30000000,
      readLength: 1,
      dataUnit: ByteDataUnit.Word,
      signedness: Signedness.Signed,
    }),
    storage.readData({
      address: 0x30000004,
      readLength: 1,
      dataUnit: ByteDataUnit.Byte,
      signedness: Signedness.Unsigned,
    }),
    storage.readData({
      address: 0x30000005,
      readLength: 1,
      dataUnit: ByteDataUnit.Byte,
      signedness: Signedness.Signed,
    }),
  ];

  console.log(dataReads.map((el) => el.value));
}
