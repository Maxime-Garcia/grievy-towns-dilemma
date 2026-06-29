using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class PlayerCreation : MonoBehaviour
{
    private Vector3 spawnPoint;
    public GameObject prefabPlayer;
    private GameObject player;
    public  GameObject GameOver;

    // Use this for initialization
    void Awake()
    {
        if (GameObject.FindGameObjectWithTag("Player") == null)
        {
            player = Instantiate(prefabPlayer) as GameObject;
            DontDestroyOnLoad(player);
            DontDestroyOnLoad(this.gameObject);
            DontDestroyOnLoad(GameObject.Find("dialogueManager"));
            DontDestroyOnLoad(GameObject.Find("Canvas"));
            DontDestroyOnLoad(GameObject.Find("CanvasGameOver"));
            DontDestroyOnLoad(GameObject.Find("PlayerManager"));
            DontDestroyOnLoad(GameObject.Find("LevelManager"));
        }
       

       
    }
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {
    }
}
