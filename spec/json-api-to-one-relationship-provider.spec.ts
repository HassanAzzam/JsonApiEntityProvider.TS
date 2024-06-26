import { EntitySet } from '@dipscope/entity-store';
import { Company, generateRandomString, SpecEntityStore, User } from './entity-store.spec';

async function addUser(userSet: EntitySet<User>, name?: string) 
{
    name ??= generateRandomString();

    const user = new User(name, 1);
    const remoteUser = await userSet.add(user);

    expect(remoteUser).toBe(user);

    return remoteUser;
}

async function setupRelationshipTest() 
{
    // Get Entity Store Objects.
    const specEntityStore = new SpecEntityStore('passthrough');
    const userSet = specEntityStore.userSet;
    const companySet = specEntityStore.companySet;
    const jsonApiEntityProvider = specEntityStore.jsonApiEntityProvider;

    // Create a User and a Message.
    const user = await addUser(userSet);
    const company = await companySet.add(createCompany());

    // Create 3 initial Messages.
    const userCompany = jsonApiEntityProvider.createJsonApiToOneRelationship(userSet, user, u => u.company);
    const userCompanyCustom = jsonApiEntityProvider.createJsonApiToOneRelationship(userSet, user, u => u.company, 'custom-action');

    return { specEntityStore, company, userSet, companySet, jsonApiEntityProvider, user, userCompany, userCompanyCustom };
}

function createCompany(text?: string) 
{
    text ??= generateRandomString();

    return new Company(text);
}

describe('Json api to many relationship provider', () => 
{
    it('should fetch existing entity', async () =>
    {
        const { userSet, company, userCompany, user } = await setupRelationshipTest();

        expect(user.company).toBeUndefined();

        // We have some continued setup, we need to assign a company to the user.
        user.company = company;

        const initialUser = await userSet.update(user);

        expect(initialUser.company).toBeDefined();

        // ! Function Under Test !
        // Let's check that the message was linked correctly.
        const data = await userCompany.find();

        expect(data).toEqual(company);
    });
    it('should fetch existing entity from a custom path', async () =>
    {
        const { userSet, company, userCompanyCustom, user } = await setupRelationshipTest();

        expect(user.company).toBeUndefined();

        // We have some continued setup, we need to assign a company to the user.
        user.company = company;

        const initialUser = await userSet.update(user);

        expect(initialUser.company).toBeDefined();

        // ! Function Under Test !
        // Let's check that the message was linked correctly.
        // SHOULD NOT PASS with injector set to passthrough.
        const data = await userCompanyCustom.find();

        expect(data).toEqual(company);
    });
    
    it('should update existing entities', async () =>
    {
        const { userCompany, company, user } = await setupRelationshipTest();
        expect(user.company).toBeUndefined();

        // ! Function Under Test !
        await userCompany.update(company);

        // Let's check that the message was linked correctly.
        const finalData = await userCompany.find();

        expect(finalData?.id).toBe(company.id);
    });

    it('should remove existing entities', async () =>
    {
        const { userCompany, user, company, userSet } = await setupRelationshipTest();

        // We have some continued setup, we need to assign a company to the user.
        user.company = company;

        const initialUser = await userSet.update(user);

        expect(initialUser.company).toBeDefined();

        // ! Function Under Test !
        await userCompany.remove();

        // Let's check that the message was unlinked correctly.
        const finalData = await userCompany.find();

        expect(finalData).toBeNull();
    });

    // ! Include Clauses Not Yet Implemented !
    // it('should include relationships', async () =>
    // {
    //     const { userSet, company, userCompany, user } = await setupRelationshipTest();
    // 
    //     expect(user.company).toBeUndefined();
    //
    //     // We have some continued setup, we need to assign a company to the user.
    //     user.company = company;
    //
    //     const initialUser = await userSet.update(user);
    //
    //     expect(initialUser.company).toBeDefined();
    //
    //     // ! Function Under Test !
    //     // Let's check that the message was linked correctly.
    //     const data = await userCompany.include(x => x.users).findOne();
    //
    //     expect(data?.id).toEqual(company.id);
    //     expect(data?.users.at(0)?.id).toEqual(user.id);
    // });

    // it('should include a collection of relationships', async () =>
    // {
    //     const { userSet, company, userCompany, user } = await setupRelationshipTest();
    //
    //     expect(user.company).toBeUndefined();
    //
    //     // We have some continued setup, we need to assign a company to the user.
    //     user.company = company;
    //
    //     const initialUser = await userSet.update(user);
    //
    //     expect(initialUser.company).toBeDefined();
    //
    //     // ! Function Under Test !
    //     // Let's check that the message was linked correctly.
    //     const data = await userCompany.includeCollection(x => x.users).findOne();
    //
    //     expect(data?.id).toEqual(company.id);
    //     expect(data?.users.at(0)?.id).toEqual(user.id);
    // });
});
