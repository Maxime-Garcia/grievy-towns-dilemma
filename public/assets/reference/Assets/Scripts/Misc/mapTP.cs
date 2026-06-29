using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class mapTP : MonoBehaviour {
    private GameObject player;
//    private string ObjectName;
    private string SpawnName;
    public string scene;
    private Vector3 spawnPoint;
    
    // Use this for initialization
    void Start () {
        player = GameObject.FindGameObjectWithTag("Player");
//        spawnPoint = GameObject.Find("SpawnPoint").transform.position;
//        player.transform.position = spawnPoint;
    }

    // Update is called once per frame
    void Update () {
    }
    
    private void OnCollisionEnter2D(Collision2D collision)
    {
//        SpawnName = "Spawn"+ gameObject.name.Substring(5);
        
        SceneManager.LoadScene(scene);
//        spawnPoint = GameObject.Find(SpawnName).transform.position;
//        player.transform.position = spawnPoint;
    }
}
