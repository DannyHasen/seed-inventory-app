package com.projectEvergreen.seed_inventory.io;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectEvergreen.seed_inventory.model.Crop;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;

public class CropStore
{
    private final Path file;
    private final ObjectMapper mapper = new ObjectMapper();

    public CropStore(Path file)
    {
        this.file = file;
    }

    public List<Crop> loadAll() throws IOException
    {
        if (!Files.exists(file))
        {
            return new ArrayList<>();
        }

        if (Files.size(file) == 0)
        {
            return new ArrayList<>();
        }

        byte[] data = Files.readAllBytes(file);
        List<Crop> crops = mapper.readValue(data, new TypeReference<List<Crop>>() {});

        if (crops == null)
        {
            return new ArrayList<>();
        }

        validateCrops(crops);
        return crops;
    }

    public void saveAll(List<Crop> crops) throws IOException
    {
        if (crops == null)
        {
            throw new IllegalArgumentException("Crop list cannot be null.");
        }

        validateCrops(crops);

        Path parent = file.getParent();
        if (parent != null && !Files.exists(parent))
        {
            Files.createDirectories(parent);
        }

        byte[] json = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(crops);

        Path temp = Files.createTempFile(parent, "crops-", ".tmp");
        Files.write(temp, json, StandardOpenOption.TRUNCATE_EXISTING);

        Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    }

    private void validateCrops(List<Crop> crops)
    {
        for (int i = 0; i < crops.size(); i++)
        {
            Crop crop = crops.get(i);

            if (crop == null)
            {
                throw new IllegalArgumentException("Crop at index " + i + " is null.");
            }

            crop.setName(crop.getName());
            crop.setSeason(crop.getSeason());
            crop.setCurrentAmount(crop.getCurrentAmount());
            crop.setManualAvgCropPeriodDays(crop.getManualAvgCropPeriodDays());
        }
    }

    public static CropStore defaultStore()
    {
        Path home = Paths.get(System.getProperty("user.home"));
        return new CropStore(home.resolve(".evergreen/data/crops.json"));
    }
}
