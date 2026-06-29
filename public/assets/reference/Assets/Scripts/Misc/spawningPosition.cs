using UnityEngine;
using UnityEngine.SceneManagement;

public class spawningPosition : MonoBehaviour
{
    private GameObject player;
    //    private string ObjectName;
    private string SpawnName;
    private Vector3 spawnPoint;
    private string playerOrigin;

    void OnEnable()
    {
//        Debug.Log("OnEnable called");
        SceneManager.sceneLoaded += OnSceneLoaded;
    }

    // called second
    void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        player = GameObject.FindGameObjectWithTag("Player");
        // Debug.Log(player.GetComponent<PlayerController>().getOrigin());

        playerOrigin = player.GetComponent<PlayerController>().getOrigin();

       // Debug.Log("PO " + playerOrigin);

        if (playerOrigin != "")
        {
            SpawnName = "Spawn" + playerOrigin;
            spawnPoint = GameObject.Find(SpawnName).transform.position;
            player.transform.position = spawnPoint;
        }
    }

    // Use this for initialization
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {
    }
}
