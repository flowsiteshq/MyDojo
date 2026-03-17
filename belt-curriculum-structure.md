# MyDojo Belt Ranking System

## Belt Progression (Dragon Kid/Adult Program)

Based on the MyDojo Instructor Manual, here is the complete belt ranking system:

| Rank | Belt Color | Stripe System | Time to Next Belt |
|------|-----------|---------------|-------------------|
| 1 | White | No stripe | 3 months |
| 2 | Yellow | 1 yellow stripe | 3 months |
| 3 | Orange | 1 orange stripe | 3 months |
| 4 | Green | 1 green stripe | 3 months |
| 5 | Advanced Green | Green belt with black stripe | 3 months |
| 6 | Blue | 1 blue stripe | 3 months |
| 7 | Advanced Blue | Blue belt with black stripe | 3 months |
| 8 | Purple | 1 purple stripe | 3 months |
| 9 | Advanced Purple | Purple belt with black stripe | 3 months |
| 10 | Brown | 1 brown stripe | 3 months |
| 11 | Advanced Brown | Brown belt with black stripe | 3 months |
| 12 | Probationary Black | Black belt with white stripe | 6 months |
| 13 | Black Belt (1st Dan) | Black belt | - |

## Curriculum Access Rules

Students should only have access to curriculum content up to and including their current belt rank.

### Example Access Levels:
- **White Belt**: Can view only White belt curriculum
- **Yellow Belt**: Can view White + Yellow belt curriculum
- **Orange Belt**: Can view White + Yellow + Orange belt curriculum
- **Green Belt**: Can view White through Green belt curriculum
- **Black Belt**: Can view all curriculum content

## Implementation Notes

1. Each belt rank takes approximately 3 months to achieve (except Probationary Black which takes 6 months)
2. Progression through rank is mandatory and requires examination by certified MyDojo instructors
3. The stripe system indicates progress within each belt level
4. Students must demonstrate proficiency in all previous belt requirements before advancing

## Database Schema Needed

To implement this system, we need:
1. Add `beltRank` field to user/enrollment table (enum or string)
2. Create `curriculumContent` table with belt rank restrictions
3. Filter dashboard content based on user's current belt rank
4. Display progress toward next belt
