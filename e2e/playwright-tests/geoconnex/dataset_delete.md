# dataset_delete_test (test 3/3)

## User story

As a **CKAN dataset publisher**, I can delete a CKAN dataset. When the bulk runner runs, this CKAN dataset should not mentioned in the output.

## How this test will work (watch it live!)

1. Go to the **Dataset about Rio Grande-Albuquerque HUC8 Sub Basin** CKAN dataset page.
2. Click the **Manage** button.
3. Click the **Delete** button.
4. Click the **Confirm** button.
5. Run the bulk runner and verify that the output is empty.

Visit the terminal during/after the test to verify the test ran successfully.

**You should see empty/no output after the bulk runner has ran.**
