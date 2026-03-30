package com.projectEvergreen.seed_inventory.model;

public class Crop
{
    public enum Season
    {
        WINTER, SPRING, SUMMER, FALL
    }

    private String name;
    private Season season;
    private int currentAmount;
    private Integer manualAvgCropPeriodDays;

    public Crop()
    {
        // needed for JSON deserialization
    }

    public Crop(String name, Season season, int currentAmount, Integer manualAvgCropPeriodDays)
    {
        setName(name);
        setSeason(season);
        setCurrentAmount(currentAmount);
        setManualAvgCropPeriodDays(manualAvgCropPeriodDays);
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        if (name == null || name.trim().isEmpty())
        {
            throw new IllegalArgumentException("Name cannot be blank.");
        }

        this.name = name.trim();
    }

    public Season getSeason()
    {
        return season;
    }

    public void setSeason(Season season)
    {
        if (season == null)
        {
            throw new IllegalArgumentException("Season is required.");
        }

        this.season = season;
    }

    public int getCurrentAmount()
    {
        return currentAmount;
    }

    public void setCurrentAmount(int currentAmount)
    {
        if (currentAmount < 0)
        {
            throw new IllegalArgumentException("Amount must be 0 or greater.");
        }

        this.currentAmount = currentAmount;
    }

    public Integer getManualAvgCropPeriodDays()
    {
        return manualAvgCropPeriodDays;
    }

    public void setManualAvgCropPeriodDays(Integer manualAvgCropPeriodDays)
    {
        if (manualAvgCropPeriodDays != null && manualAvgCropPeriodDays < 0)
        {
            throw new IllegalArgumentException("Avg days must be 0 or greater.");
        }

        this.manualAvgCropPeriodDays = manualAvgCropPeriodDays;
    }
}
