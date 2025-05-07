import {
  AppShell,
  Burger,
  Button,
  Stack,
  TextInput,
  Select,
  Group,
  Text,
  FileInput,
  Paper,
  Center,
  Image,
  Box,
  Grid,
  Card,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";
import { useEffect, useState } from "react";
const backUrl = process.env.NEXT_PUBLIC_BACK_URL;

const AdminPage = () => {
  const [opened, { toggle }] = useDisclosure();
  const [showNftForm, setShowNftForm] = useState(false);
  const [nftName, setNftName] = useState("");
  const [nftImage, setNftImage] = useState(null);
  const [nftRarity, setNftRarity] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [nfts, setNfts] = useState([]);

  const handleCreateNft = () => {
    setShowNftForm(true);
  };

  const handleImageChange = (file) => {
    setNftImage(file);

    if (file) {
      // Create a preview URL for the selected image
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        setImagePreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    } else {
      setImagePreviewUrl("");
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("image", nftImage);
    formData.append("name", nftName);
    formData.append("rarity", nftRarity);

    try {
      const response = await axios.post(`${backUrl}/createNft`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("NFT created:", response.data);

      // Reset form
      setNftName("");
      setNftImage(null);
      setNftRarity("");
      setImagePreviewUrl("");
      setShowNftForm(false);
    } catch (error) {
      console.error("Error uploading NFT:", error);
    }
  };

  useEffect(() => {
    const fetchNfts = async () => {
      try {
        const response = await axios.get(`${backUrl}/getAllNft`);
        setNfts(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке NFT:", error);
      }
    };

    fetchNfts();
  }, []);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text>NFT Admin Dashboard</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text>Navigation</Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack>
          <Button color="blue" onClick={handleCreateNft} disabled={showNftForm}>
            Create NFT
          </Button>

          {showNftForm && (
            <Paper shadow="xs" p="md" withBorder>
              <Stack spacing="md">
                <Text size="lg" fw={500}>
                  Create New NFT
                </Text>

                <Group position="apart" align="flex-start" spacing="xl">
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing="md">
                      <FileInput
                        label="Upload NFT Image"
                        placeholder="Select image"
                        value={nftImage}
                        onChange={handleImageChange}
                        accept="image/*"
                        required
                      />

                      <TextInput
                        label="NFT Name"
                        placeholder="Enter NFT name"
                        value={nftName}
                        onChange={(event) =>
                          setNftName(event.currentTarget.value)
                        }
                        required
                      />

                      <Select
                        label="Rarity"
                        placeholder="Select rarity level"
                        value={nftRarity}
                        onChange={setNftRarity}
                        data={[
                          { value: "common", label: "Common" },
                          { value: "uncommon", label: "Uncommon" },
                          { value: "rare", label: "Rare" },
                          { value: "epic", label: "Epic" },
                          { value: "legendary", label: "Legendary" },
                        ]}
                        required
                      />
                    </Stack>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Text weight={500} mb="sm">
                      Image Preview
                    </Text>
                    {imagePreviewUrl ? (
                      <Image
                        src={imagePreviewUrl}
                        radius="md"
                        alt="NFT Preview"
                        height={240}
                        fit="contain"
                        withPlaceholder={false}
                      />
                    ) : (
                      <Center
                        style={{
                          border: "1px dashed #ced4da",
                          borderRadius: "8px",
                          height: "240px",
                        }}
                      >
                        <Text color="dimmed">No image selected</Text>
                      </Center>
                    )}

                    {nftName && (
                      <Text align="center" size="lg" weight={500} mt="sm">
                        {nftName}
                      </Text>
                    )}

                    {nftRarity && (
                      <Text align="center" color="dimmed" mt="xs">
                        Rarity:{" "}
                        {nftRarity.charAt(0).toUpperCase() + nftRarity.slice(1)}
                      </Text>
                    )}
                  </Box>
                </Group>

                <Group position="right" mt="md">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNftForm(false);
                      setNftName("");
                      setNftImage(null);
                      setNftRarity("");
                      setImagePreviewUrl("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>Create</Button>
                </Group>
              </Stack>
            </Paper>
          )}
        </Stack>
        <Grid>
          {nfts.map((nft) => (
            <Grid.Col span={4} key={nft.nftId}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image
                    src={`${backUrl}${nft.path}`}
                    height={160}
                    alt={nft.name}
                  />
                </Card.Section>

                <Text fw={500} size="lg" mt="md">
                  {nft.name}
                </Text>
                <Text size="sm" color="dimmed">
                  Rarity: {nft.rarity}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </AppShell.Main>
    </AppShell>
  );
};

export default AdminPage;
