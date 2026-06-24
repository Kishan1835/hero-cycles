# Pseudocode

## Section 9 — Pseudocode

### Price Calculation (configuration total + breakdown)

```
function calculateConfigurationPrice(configurationId, asOfDate):
    config = loadConfigurationWithParts(configurationId)
    if config is null:
        throw NotFoundError

    partIds = distinct partId values from config.parts

    # Single batched query: for each partId, the latest price point
    # with effectiveDate <= asOfDate. Avoids one query per part (N+1).
    priceMap = getLatestPriceAsOfForParts(partIds, asOfDate)

    total = 0
    hasUnpriced = false
    breakdown = []

    for each componentPart in config.parts:
        priceEntry = priceMap.get(componentPart.partId)

        if priceEntry exists:
            unitCost = priceEntry.cost
            lineTotal = unitCost * componentPart.quantity
            total += lineTotal
            priced = true
        else:
            unitCost = null
            lineTotal = null
            hasUnpriced = true
            priced = false

        breakdown.append({
            partId, partName, category, sku,
            quantity: componentPart.quantity,
            unitCost, lineTotal, priced
        })

    return { totalCost: total, hasUnpricedComponents: hasUnpriced, breakdown }
```

### Historical Price Retrieval (price of one part as of a date)

```
function getPriceAsOf(partId, asOfDate):
    part = findPart(partId)
    if part is null:
        throw NotFoundError

    # "Latest price point on or before asOfDate" — the single rule
    # that makes the whole history model work.
    price = query PartPriceHistory
        where partId = partId AND effectiveDate <= asOfDate
        order by effectiveDate DESC
        limit 1

    if price is null:
        throw BadRequestError("no price recorded on or before this date")

    return price
```

### Configuration Creation

```
function createConfiguration(input, userId):
    uniquePartIds = distinct(input.parts.map(p => p.partId))
    if uniquePartIds.length != input.parts.length:
        throw BadRequestError("duplicate partId entries")

    for each partId in uniquePartIds:
        if not partExists(partId):
            throw BadRequestError("unknown part: " + partId)

    try:
        config = insert BicycleConfiguration {
            name, description, modelCode, createdById: userId
        }
        for each (partId, quantity) in input.parts:
            insert ConfigurationPart { configurationId: config.id, partId, quantity }
    catch UniqueConstraintViolation on modelCode:
        throw ConflictError("model code already exists")

    recordAudit(CREATE, "BicycleConfiguration", config.id)
    return config
```

### Price Update (adding a new price point)

```
function addPricePoint(partId, cost, effectiveDate, note, userId):
    part = findPart(partId)
    if part is null:
        throw NotFoundError

    existing = query PartPriceHistory
        where partId = partId AND effectiveDate = effectiveDate
    if existing exists:
        throw ConflictError("a price already exists on this exact date")

    pricePoint = insert PartPriceHistory {
        partId, cost, effectiveDate, changedById: userId, note
    }

    recordAudit(PRICE_CHANGE, "Part", partId, { cost, effectiveDate })
    return pricePoint
```

### Dashboard Analytics

```
function getDashboardSummary():
    totalActiveParts = count Parts where status = ACTIVE
    activeConfigurations = count BicycleConfiguration where isActive = true
    activeUsers = count User where isActive = true
    priceChangesLast30Days = count PartPriceHistory where createdAt >= (now - 30 days)

    recentActivity = query AuditLog
        order by createdAt DESC
        limit 10
        join User for actor name

    # v1 proxy for "popular" until real usage/quote tracking exists —
    # ranked by component count as a stand-in for model complexity/flagship status.
    topConfigurations = query BicycleConfiguration
        where isActive = true
        order by count(parts) DESC
        limit 5

    for each config in topConfigurations:
        config.totalCost = calculateConfigurationPrice(config.id, now()).totalCost

    return { kpis: {...}, recentActivity, topConfigurations }
```
